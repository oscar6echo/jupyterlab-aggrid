import requests as rq
import pandas as pd


base_url = "https://github.com/ag-grid/ag-grid-docs/raw/master/src/"

urls = [
    base_url + "olympicWinners.json",
    base_url + "stocks.json",
    base_url + "weather_se_england.json",
    "https://www.ag-grid.com/example-assets/row-data.json",
]

for url in urls:
    r = rq.get(url)
    print(url, r.status_code)
    data = r.json()

    df = pd.DataFrame(data)

    fn_out = url.split("/")[-1].split(".json")[0] + ".csv"
    df.to_csv(fn_out, index=False)
