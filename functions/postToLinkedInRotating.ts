import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const postRotation = [
  {
    angle: "cost_savings",
    content: `🚗💡 Just launched Rebel Auto Agent — a free AI tool that explains your check engine code in plain English.

Most shops charge $100-150 just to diagnose. This takes 30 seconds.

Enter your fault code → get:
✅ What it actually means
✅ How serious it is
✅ Estimated repair cost
✅ Next steps

No account. No ads. Free.

Try it: rebelauto-diagnostics-ai.com

#AutoRepair #DIYCars #SaveMoney #CarTech`,
  },
  {
    angle: "builder_angle",
    content: `Building autonomous systems for car owners 🔧⚡

Just shipped Rebel Auto Agent — an AI diagnostic tool that reads OBD-II codes and tells you what's actually wrong with your car in seconds.

Built with:
• OpenAI's GPT for intelligent diagnosis
• Web OBD scanning (WiFi & Bluetooth)
• Mobile-first design
• Real-time fault interpretation

Free to use, feedback-driven development.

Check it out: rebelauto-diagnostics-ai.com

#BuildInPublic #AI #Automotive #SideProject`,
  },
  {
    angle: "problem_solution",
    content: `Problem: Check engine light. No idea what it means. Shop wants $150 just to look at it.

Solution: Rebel Auto Agent 🚗✨

Paste your OBD fault code → AI explains:
• What the error means
• Consequences of ignoring it
• Estimated repair range
• Recommended action

Literally built this because I was tired of paying shops for basic diagnostics.

Free here: rebelauto-diagnostics-ai.com

#CarOwner #AutoRepair #FrugalLiving`,
  },
  {
    angle: "tech_stack",
    content: `Just shipped a full-stack AI car diagnostic platform 🚗⚡

Tech stack:
• Next.js + React (frontend)
• Base44 backend (entities, automations, functions)
• OpenAI API (fault code interpretation)
• ELM327 OBD integration (WiFi & Bluetooth)
• Stripe payments (coming soon)

Built to scale from MVP → monetized SaaS.

Try the free MVP: rebelauto-diagnostics-ai.com

#WebDevelopment #AI #Automotive #Startup`,
  },
  {
    angle: "community_feedback",
    content: `🙋 Rebel Auto Agent is live and I need your feedback.

Built a free tool that interprets car fault codes using AI. Works on iPhone & Android. No payment required.

If you:
• Have a car with a check engine light
• Like building products
• Want to see AI applied to real problems

I'd love your thoughts: rebelauto-diagnostics-ai.com

Early feedback is gold. Drop your code in the comments and let's see what the AI says.

#ProductFeedback #BuildInPublic`,
  },
];

export default async function handler(req: any, context: any) {
  try {
    // Determine which post to use (rotate daily)
    const dayOfMonth = new Date().getDate();
    const postIndex = dayOfMonth % postRotation.length;
    const selectedPost = postRotation[postIndex];

    // Call LinkedIn API
    const response = await fetch(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: selectedPost.content,
              },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        ok: false,
        error: `LinkedIn API error: ${error.message || response.statusText}`,
      };
    }

    const result = await response.json();
    return {
      ok: true,
      message: `Posted to LinkedIn (angle: ${selectedPost.angle})`,
      postId: result.id,
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
