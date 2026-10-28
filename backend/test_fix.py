import market_data
result = market_data.get_market_meta()
print("States count:", len(result["states"]))
print("First state:", result["states"][0])
print("Districts in first state:", result["states"][0]["districts"][:3])