var LamboToken = artifacts.require("./LamboToken.sol");
// var LamboStaking = artifacts.require("./LamboStaking.sol");
var Presale = artifacts.require("./LamboPresale.sol");

module.exports = function(deployer, network, accounts) {

    //Deploy the staking contract
    //deployer.deploy(LamboStaking, LamboToken, _lpToken, _duration, _rewardDistribution, _storage);
    
    //Token constructor takes
    //mindeltatwap, initdistributionaddress, MechanicPercent
    //deployer.deploy(LamboToken, 172800, accounts[1], 25);

    //Deploy the presale contract
    //.deploy(Presale, )

    // deployer.deploy(LamboToken, 172800, accounts[1], 25).then(
    //     DeployedContract =>{
    //     deployer.deploy(LamboStaking,DeployedContract.address);
    //     }
    //  )

    // deployer.deploy(LamboToken, 172800, 25).then(
    //     DeployedContract =>{
    //     deployer.deploy(Presale, DeployedContract.address)
    //     }
    // )

    deployer.deploy(LamboToken, 172800, 120, 25);
    deployer.deploy(Presale);
};