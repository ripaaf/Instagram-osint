# Instagram-osint
retriving liked post of a person and other public infomation avaible

# How to Find Your Query Hashes
1. Open Instagram: Log in to your account on a desktop browser (Chrome or Edge is best).
2. Open Developer Tools: Press F12 or Right-Click anywhere and select Inspect.
3. Go to the Network Tab: Click the Network tab at the top of the inspector window.
4. Filter for GraphQL: In the "Filter" box (top left of the network tab), type graphql.
5. Trigger the Action:
      For Timeline/Posts: Scroll down on any profile.
      For Followers: Click on the "Followers" count of a profile.
6. Find the Request: Look for a new entry named query/?query_hash=... or graphql/query.
7. Copy the Hash: * Click on that request.
      Under the Payload or Headers tab, look for query_hash.

_Copy that long string of letters and numbers (e.g., e769aa13...) and paste it into the HASHES section of the script._

# How To Use
just copy the inject.js code into console in instagram.com and let it run


# Instagram Network Tab Reference (2026) 

### find these key in the payload tab of the request
| Action     | Common Key Name in Network Tab | Example Value (2026)                          |
|------------|---------------------------------|-----------------------------------------------|
| Timeline   | doc_id or query_hash            | 8710294155302324 or c76146de99bb02f7415203be841dd25a |
| Following  | doc_id or query_hash            | 9102384757102938 or d04b0a864b4b54887c0d870b0e77e076 |
| Followers  | doc_id or query_hash            | 7510213844102938 or e769ag130647d2354c40ea6a439abd08 |
| Tagged     | doc_id or query_hash            | 1029384754610293 or be13233562486510300db2724a87600b |
