import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const POSTS = [
  `🔧 Most people pay $100–150 just to find out what their check engine light means.

I built a free AI tool that tells you in plain English — what the code means, how serious it is, estimated repair cost, and what to do next.

No account needed. Works on iPhone & Android.

Try it free 👉 rebelauto-diagnostics-ai.com

#AutoRepair #CarDIY #AI #CarMaintenance #CheckEngineLight`,

  `⚡ Built an AI diagnostic agent for car owners.

Plug in your OBD-II scanner → enter the fault code → get a full breakdown in plain English.

✅ What it means
✅ Consequences if ignored
✅ Estimated repair cost
✅ Recommended next step

It's free. No login required.

rebelauto-diagnostics-ai.com

#AITools #Automotive #CarRepair #DIY #StartupLife`,

  `💡 The average American spends $1,200/year on car repairs.

A big chunk of that goes to diagnostic fees — just to find out what's wrong.

Built a free tool that eliminates that cost. Enter your OBD fault code, AI explains everything in 10 seconds.

Free at rebelauto-diagnostics-ai.com 🚗

#SaveMoney #CarOwner #AutoDIY #AIAgent #CarHacks`,

  `🚗 Your check engine light comes on. What do you do?

Most people panic. Drive to a shop. Pay $100+ just to hear "It's a P0420 — catalytic converter."

I built a free AI tool that tells you the same thing instantly — plus whether it's urgent, what it'll cost, and whether you can drive safely.

rebelauto-diagnostics-ai.com

#CheckEngineLight #CarDiagnostics #AI #FreeTools #AutoRepair`,

  `🔥 MVP launch: Rebel Auto Agent

An AI-powered car diagnostic tool that translates OBD-II fault codes into plain English — free for every car owner.

Built with:
⚡ AI fault code interpretation
📶 WiFi OBD scanner support (iPhone compatible)
🔍 Symptom checker (no scanner needed)
🏪 Nearby shop finder

Beta users welcome 👉 rebelauto-diagnostics-ai.com

#BuildInPublic #IndieHacker #AI #Automotive #StartupLife`,

  `Most car owners don't know what their OBD codes mean.

That's not their fault — it's a terrible system designed to keep you dependent on shops.

Built Rebel Auto Agent to fix that. Free AI diagnostic tool. Plain English. No BS.

rebelauto-diagnostics-ai.com

#CarOwner #AutoDIY #AI #Transparency #CarRepair`,

  `🛠️ Side project → real product

Started building an AI car diagnostic agent a few months ago. It's live now.

What it does:
• Reads OBD-II fault codes
• Explains them in plain English
• Tells you repair cost range
• Finds nearby shops

All free. Built for everyday car owners, not mechanics.

rebelauto-diagnostics-ai.com

#BuildInPublic #SideProject #AI #Automotive #Entrepreneurship`,
];

const PERSON_URN = 'urn:li:person:ty4szbLa6j';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get LinkedIn access token via connector
    const connectorData = await base44.connectors.getToken('linkedin');
    const accessToken = connectorData?.access_token;

    if (!accessToken) {
      return Response.json({ error: 'LinkedIn token not available' }, { status: 401 });
    }

    // Pick post by rotation index
    const body = await req.json().catch(() => ({}));
    const postIndex = body.postIndex ?? (Math.floor(Date.now() / 86400000) % POSTS.length);
    const postText = POSTS[postIndex];

    // Post to LinkedIn
    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: PERSON_URN,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: postText },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const postData = await postRes.json();

    if (!postRes.ok) {
      return Response.json({ error: 'LinkedIn post failed', details: postData }, { status: 500 });
    }

    return Response.json({ ok: true, postId: postData.id, preview: postText.slice(0, 100) + '...' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
