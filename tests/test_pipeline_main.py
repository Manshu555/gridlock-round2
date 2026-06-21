import sys
from parking_intel import pipeline


def test_main_calls_run(monkeypatch, tmp_path):
    """Ensure the CLI entrypoint parses args and calls run() without executing the full pipeline.

    We stub out pipeline.run so the heavy work and file I/O don't run in CI.
    """
    called = {}

    def fake_run(input_path, outdir):
        called["args"] = (input_path, outdir)
        return {}

    # Replace the heavy run() with the lightweight stub
    monkeypatch.setattr(pipeline, "run", fake_run)
    # Simulate CLI invocation with --input and --outdir
    monkeypatch.setattr(sys, "argv", ["pipeline", "--input", "some.csv", "--outdir", str(tmp_path)])

    pipeline.main()

    # Confirm our stub was called with the expected outdir value
    assert called["args"][1] == str(tmp_path)
