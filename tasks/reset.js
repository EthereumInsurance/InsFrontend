task("reset", "Resets the blockchain", async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: []
  })
});
