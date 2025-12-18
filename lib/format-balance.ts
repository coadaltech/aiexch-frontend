export const formatBalance = (inrBalance: string) => {
  const floatBalance = parseFloat(inrBalance);
  return {
    usd: floatBalance.toFixed(2),
    inr: floatBalance.toFixed(2),
  };
};
