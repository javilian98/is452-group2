/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
      version: '0.8.9',
      // Might need to change to sepolia or another network
      defaultNetwork: 'sepolia',
      networks: {
        hardhat: {},
        sepolia: {
          url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
          accounts: [`0x${process.env.PRIVATE_KEY}`],
        },
      },
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  };