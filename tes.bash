curl -b cookies.txt -X POST https://api.ansilum.com/app/terrapos/transactions \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: cf0c369e-2cf5-49ca-9338-dc1f08dd9474" \
  -d '{
  "localUuid": "trx-1770225647893-355612",
  "outletId": "b8e27810-a171-4fa2-8057-40ade643982c",
  "cashierId": "755a43d3-d412-4b9a-9d60-323a2eb5b2ac",
  "items": [
    {
      "productId": "b4d01adc-51b5-4628-905b-2c88ddab1290",
      "quantity": 2,
      "discountAmount": 0,
      "notes": "string"
    }
  ],
  "discountAmount": 0,
  "discountPercent": 0,
  "customerName": "John Doe",
  "customerPhone": "081234567890",
  "tableNumber": "string",
  "notes": "string",
  "reservationDate": "2026-03-01T10:00:00.000Z",
  "depositAmount": 50000
}' | jq .