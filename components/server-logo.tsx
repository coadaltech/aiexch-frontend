import { serverApi } from "@/lib/server-api";

const ServerLogo = async () => {
  const theme = await serverApi.getTheme();
  //   console.log("Theme", theme)
  return <div>Hello</div>;
};

export default ServerLogo;
