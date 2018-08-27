module.exports = {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    },
    networks: {
         development: {
              host: "localhost",
              port: 8545,
              network_id: "*", // Match any network id
              gas: 6721975, // 6721975
              //gasLimit:
            }
       }
};
