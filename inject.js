(async () => {
    // --- ⚙️ MASTER CONFIGURATION ---
    const TARGET_USERNAME = 'target_username_here'; 
    const RUN_SCAN = true;               // [MASTER TOGGLE] Set to false to ONLY show Profile OSINT
    const SCAN_MODE = 'following';       // OPTIONS: 'followers' or 'following'
    const LIMIT_POSTS_PER_USER = 3;      // 0 = Scan ALL posts (Deep), 3 = Quick check
    
    // --- 📁 EXPORT CONFIGURATION ---
    const EXPORT_CONFIG = {
        enabled: true,           // Download file automatically at the end
        format: 'excel',         // OPTIONS: 'excel' (CSV) or 'json'
        fileName: `osint_${TARGET_USERNAME}_${new Date().getTime()}`
    };

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

    // --- 🧬 DATA STORE & HELPERS ---
    let collectedData = [];
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const log = (msg, color = "#3897f0") => console.log(`%c${msg}`, `color: ${color}; font-weight: bold;`);

    const downloadFile = (content, fileName, contentType) => {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    };

    log(`🚀 INITIALIZING DEEP OSINT: @${TARGET_USERNAME}`, "#00d4ff");

    try {
        // 1. PRIMARY PROFILE HARVESTING
        const profileRes = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${TARGET_USERNAME}`, { 
            headers: { "X-IG-App-ID": APP_ID } 
        }).then(r => r.json());
        
        const user = profileRes.data.user;

        if (MODULES.profile_metadata) {
            log("\n[+] PROFILE METADATA", "#fca311");
            const profileInfo = {
                type: 'PROFILE_HEADER',
                username: user.username,
                full_name: user.full_name,
                bio: user.biography.replace(/\n/g, " "),
                id: user.id,
                category: user.category_name || 'Personal',
                threads: user.threads_subscribe_title || 'None'
            };
            console.table(profileInfo);
            collectedData.push(profileInfo);
        }

        if (!RUN_SCAN) return log("\n⚠️ RUN_SCAN IS OFF. Ending session.", "#ffcc00");
        if (user.is_private && !user.followed_by_viewer) return log("🛑 PRIVATE ACCOUNT. Aborting.", "#ff4b2b");

        // 2. TIMELINE ANALYSIS
        if (MODULES.behavioral_data || MODULES.location_intel) {
            log("\n[+] TIMELINE & GEOGRAPHIC ANALYSIS", "#fca311");
            const timeline = await fetch(`https://www.instagram.com/graphql/query/?query_hash=${HASHES.timeline}&variables=${JSON.stringify({id: user.id, first: 12})}`).then(r => r.json());
            timeline.data.user.edge_owner_to_timeline_media.edges.forEach(p => {
                const n = p.node;
                const time = new Date(n.taken_at_timestamp * 1000).toLocaleString();
                collectedData.push({ type: 'TARGET_POST', time, shortcode: n.shortcode, location: n.location?.name || 'None' });
                console.log(`📸 [${time}] Code: ${n.shortcode}`);
            });
        }

        // 3. NETWORK SCANNING
        if (MODULES.network_likes) {
            log(`\n[+] SCANNING ${SCAN_MODE.toUpperCase()} FOR YOUR LIKES`, "#fca311");
            let network = [];
            let cursor = null;
            let hasNext = true;

            while (hasNext) {
                const res = await fetch(`https://www.instagram.com/graphql/query/?query_hash=${HASHES[SCAN_MODE]}&variables=${JSON.stringify({id: user.id, first: 50, after: cursor})}`).then(r => r.json());
                const edge = (SCAN_MODE === 'followers') ? res.data.user.edge_followed_by : res.data.user.edge_follow;
                network.push(...edge.edges);
                hasNext = edge.page_info.has_next_page;
                cursor = edge.page_info.end_cursor;
                if (hasNext) await sleep(2000);
            }

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
                            const likeEntry = {
                                type: 'LIKED_POST_IN_NETWORK',
                                owner: node.username,
                                url: `https://instagram.com/p/${m.node.shortcode}/`,
                                date: new Date(m.node.taken_at_timestamp * 1000).toLocaleString()
                            };
                            log(`❤️ Like Found @${node.username}`, "#ed4956");
                            collectedData.push(likeEntry);
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
                await sleep(Math.floor(Math.random() * (DELAY.max - DELAY.min)) + DELAY.min);
            }
        }

        // --- 🏁 EXPORT ---
        if (EXPORT_CONFIG.enabled && collectedData.length > 0) {
            log(`\n💾 EXPORTING ${collectedData.length} ROWS...`, "#2db84d");
            if (EXPORT_CONFIG.format === 'json') {
                downloadFile(JSON.stringify(collectedData, null, 2), `${EXPORT_CONFIG.fileName}.json`, 'application/json');
            } else {
                const headers = Object.keys(collectedData[collectedData.length - 1]).join(",");
                const rows = collectedData.map(obj => Object.values(obj).map(val => `"${val}"`).join(","));
                downloadFile([headers, ...rows].join("\n"), `${EXPORT_CONFIG.fileName}.csv`, 'text/csv');
            }
        }

        log("\n✨ DEEP SCAN COMPLETE", "#2db84d");
    } catch (err) {
        console.error("❌ ERROR:", err);
    }
})();
