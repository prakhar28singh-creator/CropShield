from fastapi import FastAPI

app = FastAPI(title="CropShield API", version="1.0.0")

# All India locations data embedded directly (no external file needed)
INDIA_LOCATIONS = [
    {"state": "Andaman and Nicobar Islands", "districts": ["Nicobars", "North And Middle Andaman", "South Andamans"]},
    {"state": "Andhra Pradesh", "districts": ["Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Anantapur", "Assam"]},
    {"state": "Arunachal Pradesh", "districts": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang"]},
    {"state": "Assam", "districts": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar"]},
    {"state": "Bihar", "districts": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai"]},
    {"state": "Chhattisgarh", "districts": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara"]},
    {"state": "Goa", "districts": ["North Goa", "South Goa"]},
    {"state": "Gujarat", "districts": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha"]},
    {"state": "Haryana", "districts": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad"]},
    {"state": "Himachal Pradesh", "districts": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur"]},
    {"state": "Jharkhand", "districts": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka"]},
    {"state": "Karnataka", "districts": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban"]},
    {"state": "Kerala", "districts": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod"]},
    {"state": "Madhya Pradesh", "districts": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat"]},
    {"state": "Maharashtra", "districts": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed"]},
    {"state": "Manipur", "districts": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West"]},
    {"state": "Meghalaya", "districts": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills"]},
    {"state": "Mizoram", "districts": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei"]},
    {"state": "Nagaland", "districts": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung"]},
    {"state": "Odisha", "districts": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak"]},
    {"state": "Punjab", "districts": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib"]},
    {"state": "Rajasthan", "districts": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer"]},
    {"state": "Sikkim", "districts": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"]},
    {"state": "Tamil Nadu", "districts": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore"]},
    {"state": "Telangana", "districts": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon"]},
    {"state": "Tripura", "districts": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala"]},
    {"state": "Uttar Pradesh", "districts": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha"]},
    {"state": "Uttarakhand", "districts": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Chitrakoot"]},
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
