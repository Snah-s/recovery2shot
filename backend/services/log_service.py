from pathlib import Path
from datetime import datetime
import json

LOG_DIR = Path(__file__).parents[1] / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_PATH = LOG_DIR / "metrics.log"


class LogService:

    @staticmethod
    def write(event: dict):
        record = {
            "ts_server_utc": datetime.utcnow().isoformat(),
            **event
        }

        with LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        return True