import requests

client_id = "6140229514660.6138267535718"
client_secret = "3dad9ea660dbc6029981495a0a7f1d14"
refresh_token = "xoxe-1-My0xLTYxNDAyMjk1MTQ2NjAtNjE4MDcwMjg3Mzc5Ny02MTg2MDgzNDQ1NDYwLTI5MjNhMzFkY2NlNGRjNjc0OWVjM2Q0MmMzM2E5NzBhNDYxN2ViZWU3Nzc5N2U5YTljMDQyZTgxYmU5NWEwOGU"  

url = "https://slack.com/api/oauth.v2.access"

payload = {
    "client_id": client_id,
    "client_secret": client_secret,
    "grant_type": "refresh_token",
    "refresh_token": refresh_token
}
response = requests.post(url, data=payload)
print(response.json())
