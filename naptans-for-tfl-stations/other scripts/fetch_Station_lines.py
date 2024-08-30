import requests

def extractLines(stop_point):
    stopPoint_API = f"https://api.tfl.gov.uk/StopPoint/{stop_point}"

    desired_lines = {
        "Bakerloo", "Central", "Circle", "District", "DLR", "Elizabeth line",
        "Hammersmith & City", "Jubilee", "London Overground", "Metropolitan",
        "Northern", "Piccadilly", "Tram", "Victoria", "Waterloo & City"
    }

    response = requests.get(stopPoint_API)
    data = response.json()

    lines = []

    for line in data.get("lines", []):
        line_name = line.get("name")
        if line_name in desired_lines:
            lines.append(line_name)

    return lines
