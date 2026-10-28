import json

with open('india_locations.json', 'r') as f:
    data = json.load(f)

print("TYPE:", type(data).__name__)

if isinstance(data, dict):
    print("TOP-LEVEL KEYS:", list(data.keys()))
    # Get first state
    if 'states' in data:
        first_state = data['states'][0]
        print("\nFIRST STATE:")
        print("KEYS:", list(first_state.keys()))
        print("DISTRICTS TYPE:", type(first_state.get('districts')).__name__)
        print("DISTRICTS LENGTH:", len(first_state.get('districts', [])))
        if first_state.get('districts'):
            print("FIRST 3 DISTRICTS:", first_state['districts'][:3])
        else:
            print("DISTRICTS: EMPTY ARRAY")
    else:
        # Show all keys
        for k in data.keys():
            v = data[k]
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict):
                print(f"\nKEY '{k}' - first item keys: {list(v[0].keys())}")
else:
    print("IS LIST, length:", len(data) if hasattr(data, '__len__') else 'unknown')
