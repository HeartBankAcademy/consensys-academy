//var ConvertLib = artifacts.require("./ConvertLib.sol");
//var MetaCoin = artifacts.require("./MetaCoin.sol");
var Ownable = artifacts.require("./Ownable.sol");
var Collectables = artifacts.require("./Collectables.sol");

module.exports = function(deployer) {
  deployer.deploy(Ownable);
  //deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(Collectables);
};
