import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

interface PostConfig {
  platform: 'reddit' | 'facebook';
  target: string; // subreddit or group ID
  title?: string;
  body: string;
}

const POSTS: PostConfig[] = [
  {
    platform: 'reddit',
    target: 'DIYAutoRepair',
    title: 'Built a free AI diagnostic tool for DIY car owners — tells you what your check engine code actually means',
    body: `Hey everyone — I built a free tool called Rebel Auto Agent that translates OBD-II fault codes into plain English.

Plug in your scanner, enter the code, and it tells you: what it means, what happens if you ignore it, and estimated repair cost. No shop visit needed just to find out what's wrong.

It also has a WiFi OBD scan mode for iPhone users and a symptom checker if you don't have a scanner yet.

Would love feedback from real DIYers — what would make it more useful for you?

🔗 rebelauto-diagnostics-ai.com`,
  },
  {
    platform: 'reddit',
    target: 'MechanicAdvice',
    title: 'Free tool that explains check engine codes in plain English — looking for honest feedback',
    body: `Built this for people who get a fault code and have no idea what it actually means or whether it's urgent.

Enter your OBD code → AI explains it in plain English, tells you the consequences of ignoring it, estimated repair cost range, and recommended next step.

Free to use. No account needed. Works on mobile.

Feedback welcome — especially from people who actually know cars 🙏

🔗 rebelauto-diagnostics-ai.com`,
  },
  {
    platform: 'reddit',
    target: 'Frugal',
    title: 'Free way to know if your check engine light is serious before paying a shop $150 for a diagnostic',
    body: `Most shops charge $100-150 just to read your OBD codes and tell you what's wrong. Built a free tool that does the same thing — paste in your fault code and it gives you a plain English explanation + estimated repair cost range.

Saved myself from an unnecessary shop visit last week. Sharing in case it helps anyone here.

🔗 rebelauto-diagnostics-ai.com`,
  },
  {
    platform: 'facebook',
    target: 'diyrepair',
    body: `🔧 Free AI Car Diagnostic Tool — No Shop Visit Needed

Tired of paying $100+ just to find out what your check engine light means?

I built a free tool that reads your OBD-II fault codes and tells you in plain English:
✅ What the code means
✅ How serious it is
✅ What happens if you ignore it
✅ Estimated repair cost
✅ What to do next

Works on iPhone & Android. No account needed. Free.

Try it here 👉 rebelauto-diagnostics-ai.com

Drop your code in the comments and I'll run it through for you 🙌`,
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({ postIndex: 0 }));
    const postIndex = body.postIndex ?? 0;

    if (postIndex < 0 || postIndex >= POSTS.length) {
      return Response.json({ error: 'Invalid postIndex' }, { status: 400 });
    }

    const post = POSTS[postIndex];

    // For now, return instructions to user
    // Full automation requires Browserbase setup with stored credentials
    let instructions = '';

    if (post.platform === 'reddit') {
      instructions = `
📋 Reddit Post Instructions:
Subreddit: r/${post.target}
Title: ${post.title}

Body:
${post.body}

🔗 Go to: https://reddit.com/r/${post.target}/submit
1. Paste title
2. Paste body in text field
3. Click "Post"
      `;
    } else if (post.platform === 'facebook') {
      instructions = `
📋 Facebook Post Instructions:
Group: ${post.target}

Body:
${post.body}

🔗 Instructions:
1. Go to Facebook group "${post.target}"
2. Click "Make a post"
3. Paste the text above
4. Click "Post"
      `;
    }

    return Response.json({
      ok: true,
      platform: post.platform,
      target: post.target,
      status: 'ready_for_manual_posting',
      instructions,
      preview: post.body.slice(0, 100) + '...',
      note: 'Browserbase automation requires stored Reddit/Facebook credentials. Set REDDIT_USERNAME, REDDIT_PASSWORD, FACEBOOK_EMAIL, FACEBOOK_PASSWORD in secrets to enable autonomous posting.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
