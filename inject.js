(async () => {
    // --- ⚙️ MASTER CONFIGURATION ---
    const TARGET_USERNAME = 'target_username_here'; 
    const RUN_SCAN = true;               // [MASTER TOGGLE] Set to false to ONLY show Profile OSINT
    const SCAN_MODE = 'following';       // OPTIONS: 'followers' or 'following'
    const LIMIT_POSTS_PER_USER = 3;      // 0 = Scan ALL posts (Deep), 3 = Quick check
    
    // --- 🛠️ MODULE TOGGLES (true = ON, false = OFF) ---
    const MODULES = {
        profile_metadata: true,  // Bio, ID, Name, Category
        account_history: true,   // Verification, Threads link
        music_info: true,        // Profile Song/Artist
        behavioral_data: true,   // Timestamps of posts
        location_intel: true,    // GPS/Location tags
        network_likes: true,     // Search for YOUR likes in their list
        tagged_intel: true       // Posts they are tagged in
    };

    // --- 🔑 INTERNAL SYSTEM KEYS ---
    const HASHES = {
        followers: 'KEY',
        following: 'KEY',
        timeline: 'KEY',
        tagged: 'KEY'
    };
    const APP_ID = "936619743392459";
    const DELAY = { min: 4500, max: 8000 };

    // --- 🧬 HELPER FUNCTIONS ---
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const log = (msg, color = "#3897f0") => console.log(`%c${msg}`, `color: ${color}; font-weight: bold;`);

    log(`🚀 INITIALIZING DEEP OSINT: @${TARGET_USERNAME}`, "#00d4ff");

    try {
        // 1. PRIMARY PROFILE HARVESTING
        const profileRes = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${TARGET_USERNAME}`, { 
            headers: { "X-IG-App-ID": APP_ID } 
        }).then(r => r.json());
        
        const user = profileRes.data.user;

        if (MODULES.profile_metadata) {
            log("\n[+] PROFILE METADATA", "#fca311");
            console.log(`🆔 ID: ${user.id}\n👤 Full Name: ${user.full_name}\n📝 Bio: ${user.biography}\n🌍 Category: ${user.category_name || 'Personal'}`);
        }

        if (MODULES.account_history) {
            log("\n[+] ACCOUNT CONNECTIVITY", "#fca311");
            console.log(`🔗 External URL: ${user.external_url || 'None'}`);
            console.log(`🧵 Threads ID: ${user.threads_subscribe_title || 'Not Linked'}`);
            console.log(`✅ Verified: ${user.is_verified ? 'Yes' : 'No'}`);
        }

        if (MODULES.music_info && user.music_info) {
            log("\n[+] AUDIO INTEL", "#fca311");
            const m = user.music_info.music_asset_info;
            console.log(`🎵 Profile Song: ${m.title} by ${m.display_artist}`);
        }

        // 2. SCAN CONTROL CHECK
        if (!RUN_SCAN) {
            return log("\n⚠️ RUN_SCAN IS OFF. Ending session after profile harvest.", "#ffcc00");
        }

        if (user.is_private && !user.followed_by_viewer) {
            return log("🛑 ACCOUNT IS PRIVATE. Network/Timeline modules disabled.", "#ff4b2b");
        }

        // 3. TIMELINE ANALYSIS (Behavior & Locations)
        if (MODULES.behavioral_data || MODULES.location_intel) {
            log("\n[+] TIMELINE & GEOGRAPHIC ANALYSIS", "#fca311");
            const timeline = await fetch(`https://www.instagram.com/graphql/query/?query_hash=${HASHES.timeline}&variables=${JSON.stringify({id: user.id, first: 12})}`).then(r => r.json());
            const posts = timeline.data.user.edge_owner_to_timeline_media.edges;

            posts.forEach(p => {
                const n = p.node;
                const time = new Date(n.taken_at_timestamp * 1000).toLocaleString();
                console.log(`📸 [${time}] Code: ${n.shortcode}`);
                if (MODULES.location_intel && n.location) {
                    console.log(`📍 Tagged Location: ${n.location.name} (ID: ${n.location.id})`);
                }
            });
        }

        // 4. NETWORK SCANNING (Followers/Following List)
        if (MODULES.network_likes) {
            log(`\n[+] SCANNING ${SCAN_MODE.toUpperCase()} NETWORK FOR YOUR LIKES`, "#fca311");
            let network = [];
            let cursor = null;
            let hasNext = true;

            // Fetch the full list of accounts first
            while (hasNext) {
                const res = await fetch(`https://www.instagram.com/graphql/query/?query_hash=${HASHES[SCAN_MODE]}&variables=${JSON.stringify({id: user.id, first: 50, after: cursor})}`).then(r => r.json());
                const edge = (SCAN_MODE === 'followers') ? res.data.user.edge_followed_by : res.data.user.edge_follow;
                network.push(...edge.edges);
                hasNext = edge.page_info.has_next_page;
                cursor = edge.page_info.end_cursor;
                console.log(`Collected ${network.length} accounts...`);
                if (hasNext) await sleep(2000);
            }

            // Loop through each account in the list to check for likes
            for (const item of network) {
                const node = item.node;
                if (node.is_private && !node.followed_by_viewer) continue;

                let postCursor = null;
                let postsProcessed = 0;
                let keepCheckingPosts = true;

                while (keepCheckingPosts) {
                    const postRes = await fetch(`https://www.instagram.com/graphql/query/?query_hash=${HASHES.timeline}&variables=${JSON.stringify({id: node.id, first: 12, after: postCursor})}`).then(r => r.json());
                    const media = postRes.data.user.edge_owner_to_timeline_media;
                    
                    for (const m of media.edges) {
                        if (m.node.viewer_has_liked) {
                            log(`❤️ Your Like Found @${node.username}: https://instagram.com/p/${m.node.shortcode}/`, "#ed4956");
                        }
                        postsProcessed++;
                        if (LIMIT_POSTS_PER_USER > 0 && postsProcessed >= LIMIT_POSTS_PER_USER) {
                            keepCheckingPosts = false;
                            break;
                        }
                    }

                    if (!media.page_info.has_next_page) keepCheckingPosts = false;
                    postCursor = media.page_info.end_cursor;
                    if (keepCheckingPosts) await sleep(1500);
                }
                
                // Random delay between users to mimic human behavior
                const wait = Math.floor(Math.random() * (DELAY.max - DELAY.min)) + DELAY.min;
                await sleep(wait);
            }
        }

        log("\n✨ DEEP SCAN COMPLETE", "#2db84d");

    } catch (err) {
        console.error("❌ CRITICAL ERROR DURING SCAN:", err);
    }
})();
