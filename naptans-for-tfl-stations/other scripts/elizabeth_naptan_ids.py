import requests

api_url = "https://api.tfl.gov.uk/StopPoint/Mode/Elizabeth-Line"

response = requests.get(api_url)
data = response.json()

for station in data["stopPoints"]:
    common_name = station["commonName"]

    if "stationNaptan" in station:
        naptan_id = station["stationNaptan"]
    else:
        naptan_id = "N/A"
    
    if "hubNaptanCode" in station:
        hub_naptan = station["hubNaptanCode"]
    else:
        hub_naptan = "N/A"
    
    if naptan_id != "N/A":
        print(f"{common_name}, {naptan_id}, {hub_naptan}")
