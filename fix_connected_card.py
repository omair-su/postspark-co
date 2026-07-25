import re

with open('src/components/ConnectedAccountsCard.tsx', 'r') as f:
    content = f.read()

# Remove the incorrectly inserted handleTestPublish and fix handleDisconnect
content = re.sub(r'const handleDisconnect = async \(platform: Platform, label: string\) => \{.*?const handleTestPublish = async \(\) => \{.*?\}',
                 '''const handleTestPublish = async () => {
    if (!session) return;
    setTesting(true);
    try {
      const res: any = await publishToX({
        data: { text: "Testing PostSpark X connection! 🚀 #buildinpublic" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res?.error) toast.error(res.error);
      else toast.success("Test tweet posted successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Test post failed");
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async (platform: Platform, label: string) => {
    if (!session) return;''', content, flags=re.DOTALL)

with open('src/components/ConnectedAccountsCard.tsx', 'w') as f:
    f.write(content)
