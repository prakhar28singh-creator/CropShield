from fastapi import FastAPI

app = FastAPI(title="CropShield API", version="1.0.0")

# Embedded data - no external files needed
INDIA_LOCATIONS = [
    {"state": "Andaman and Nicobar Islands", "districts": ["Nicobars", "North And Middle Andaman", "South Andamans"]},
    {"state": "Andhra Pradesh", "districts": ["Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu"]},
    {"state": "Arunachal Pradesh", "districts": ["Anjaw", "Changlang", "Dibang Valley"]},
    {"state": "Assam", "districts": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar"]},
    {"state": "Bihar", "districts": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai"]},
    {"state": "Delhi", "districts": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "South Delhi", "West Delhi"]},
    {"state": "Gujarat", "districts": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha"]},
    {"state": "Haryana", "districts": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad"]},
    {"state": "Himachal Pradesh", "districts": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur"]},
    {"state": "Karnataka", "districts": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban"]},
    {"state": "Kerala", "districts": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod"]},
    {"state": "Madhya Pradesh", "districts": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat"]},
    {"state": "Maharashtra", "districts": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed"]},
    {"state": "Punjab", "districts": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib"]},
    {"state": "Rajasthan", "districts": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer"]},
    {"state": "Tamil Nadu", "districts": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore"]},
    {"state": "Telangana", "districts": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon"]},
    {"state": "Uttar Pradesh", "districts": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha"]},
    {"state": "West Bengal", "districts": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur"]}
]

@app.get("/health")
def health():
    return {"status": "ok", "locations_loaded": len(INDIA_LOCATIONS)}

@app.get("/market-meta")
def market_meta():
    states = [
        {
            "name": entry["state"],
            "districts": sorted(entry["districts"], key=str.casefold)
        }
        for entry in sorted(INDIA_LOCATIONS, key=lambda item: item["state"].casefold())
    ]
    
    return {
        "states": states,
        "crops": [],
        "demo_notice": "DEMO Data — Synthetic prototype prices and bundled monthly history; not live or official market data."
    }

@app.get("/crops")
def list_crops():
    return {"crops": []}

@app.get("/")
def root():
    return {"status": "ok", "service": "CropShield", "locations_count": len(INDIA_LOCATIONS)}
