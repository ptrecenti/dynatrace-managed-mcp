import json
from jsonschema import validate, ValidationError
import sys

def main():
    with open("server.schema.json") as f:
        schema = json.load(f)

    with open("server.json") as f:
        data = json.load(f)

    try:
        validate(instance=data, schema=schema)
        print("✅ server.json is valid.")
    except ValidationError as e:
        print("❌ Validation failed:", e.message)
        sys.exit(1)


if __name__ == '__main__':
    main()