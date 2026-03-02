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
