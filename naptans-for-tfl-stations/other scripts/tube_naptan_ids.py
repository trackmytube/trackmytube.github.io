import requests

stopPoints_API = "https://api.tfl.gov.uk/StopPoint/Mode/Tube"

response = requests.get(stopPoints_API)
data = response.json()

array = []
naptan_ids = set()

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

    if naptan_id != "N/A" and naptan_id not in naptan_ids:
        naptan_ids.add(naptan_id)
        array.append(f"{common_name}, {naptan_id}, {hub_naptan}")

for x in array:
    print(x)
