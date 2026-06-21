"""Module 3 — Hotspot-risk forecasting (Phase 6).

Builds a per-cell daily time series and trains a gradient-boosted regressor to predict
next-window violation intensity (-> hotspot risk). Uses LightGBM when available, and
falls back to scikit-learn's HistGradientBoostingRegressor otherwise, so the pipeline
always produces a forecast. Features: lags, rolling mean/std, calendar, hotspot history.
See APPROACH.md §6.2 / Phase 6.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def _make_regressor():
    """Return (model, backend_name). Prefer LightGBM, else sklearn GBDT."""
    try:
        from lightgbm import LGBMRegressor

        return (
            LGBMRegressor(
                n_estimators=300, learning_rate=0.05, num_leaves=31,
                subsample=0.8, colsample_bytree=0.8, random_state=42, verbosity=-1,
            ),
            "lightgbm",
        )
    except Exception:
        from sklearn.ensemble import HistGradientBoostingRegressor

        return (
            HistGradientBoostingRegressor(
                max_iter=300, learning_rate=0.05, max_leaf_nodes=31, random_state=42
            ),
            "sklearn_histgbm",
        )


def build_panel(df_events: pd.DataFrame) -> pd.DataFrame:
    """Construct a (h3 x date) daily panel of violation counts with engineered features."""
    daily = (
        df_events.groupby(["h3", "date"]).size().rename("violations").reset_index()
    )
    daily["date"] = pd.to_datetime(daily["date"])

    # Dense per-cell daily index so lags/rolling are well-defined
    frames = []
    full_range = pd.date_range(daily["date"].min(), daily["date"].max(), freq="D")
    for cell, g in daily.groupby("h3"):
        s = g.set_index("date")["violations"].reindex(full_range, fill_value=0)
        f = pd.DataFrame({"h3": cell, "date": s.index, "violations": s.values})
        frames.append(f)
    panel = pd.concat(frames, ignore_index=True)

    panel = panel.sort_values(["h3", "date"])
    grp = panel.groupby("h3")["violations"]
    for lag in (1, 7, 14):
        panel[f"lag_{lag}"] = grp.shift(lag)
    panel["roll_mean_7"] = grp.shift(1).rolling(7).mean().reset_index(level=0, drop=True)
    panel["roll_std_7"] = grp.shift(1).rolling(7).std().reset_index(level=0, drop=True)
    panel["roll_mean_14"] = grp.shift(1).rolling(14).mean().reset_index(level=0, drop=True)
    panel["dayofweek"] = panel["date"].dt.dayofweek
    panel["is_weekend"] = (panel["dayofweek"] >= 5).astype(int)
    panel["day"] = panel["date"].dt.day
    panel["hotspot_history"] = grp.shift(1).rolling(28).mean().reset_index(level=0, drop=True)
    return panel.dropna().reset_index(drop=True)


FEATURES = [
    "lag_1", "lag_7", "lag_14", "roll_mean_7", "roll_std_7",
    "roll_mean_14", "dayofweek", "is_weekend", "day", "hotspot_history",
]


def train_forecast(df_events: pd.DataFrame) -> tuple[object, dict, pd.DataFrame]:
    """Train the forecaster with a temporal holdout. Returns (model, metrics, predictions)."""
    panel = build_panel(df_events)
    if len(panel) < 100:
        # Not enough history -> naive persistence
        panel["prediction"] = panel["lag_1"]
        metrics = {"backend": "naive_persistence", "n_samples": int(len(panel))}
        return None, metrics, panel

    cutoff = panel["date"].quantile(0.8)
    train = panel[panel["date"] <= cutoff]
    test = panel[panel["date"] > cutoff]

    model, backend = _make_regressor()
    model.fit(train[FEATURES], train["violations"])
    pred = model.predict(test[FEATURES]).clip(min=0)

    mae = float(np.mean(np.abs(pred - test["violations"].to_numpy())))
    rmse = float(np.sqrt(np.mean((pred - test["violations"].to_numpy()) ** 2)))
    # MASE vs seasonal-naive (lag_7)
    naive_err = float(np.mean(np.abs(test["violations"].to_numpy() - test["lag_7"].to_numpy())))
    mase = mae / naive_err if naive_err > 1e-9 else float("nan")

    # Classification metrics
    from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score
    y_true_bin = (test["violations"].to_numpy() > 0).astype(int)
    y_pred_bin = (pred > 0.5).astype(int)
    
    try:
        auc_roc = float(roc_auc_score(y_true_bin, pred))
    except Exception:
        auc_roc = 0.5
        
    f1 = float(f1_score(y_true_bin, y_pred_bin, zero_division=0))
    precision = float(precision_score(y_true_bin, y_pred_bin, zero_division=0))
    recall = float(recall_score(y_true_bin, y_pred_bin, zero_division=0))

    test = test.copy()
    test["prediction"] = pred
    metrics = {
        "backend": backend,
        "n_train": int(len(train)),
        "n_test": int(len(test)),
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "mase_vs_seasonal_naive": round(mase, 4),
        "auc_roc": round(auc_roc, 4),
        "f1": round(f1, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
    }
    return model, metrics, test


def shap_summary(model, sample: pd.DataFrame) -> dict | None:
    """Optional SHAP global importance; returns None if shap unavailable."""
    try:
        import shap
    except Exception:
        return None
    try:
        explainer = shap.TreeExplainer(model)
        vals = explainer.shap_values(sample[FEATURES].head(500))
        importance = np.abs(vals).mean(axis=0)
        return {f: round(float(v), 4) for f, v in zip(FEATURES, importance, strict=False)}
    except Exception:
        return None
