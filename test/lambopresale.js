// const { expect } = require("chai");
// const {
//   expectRevert, // Assertions for transactions that should fail
// } = require('@openzeppelin/test-helpers');

// const ethers = require("ethers");

// describe("LamboPresale", async function() {

//   // Contracts
//   let PreSaleContract;
//   let DegenLamboTokenContract

//   // Accounts
//   let testAccountPrimary
//   let testAccountSecondary

//   let provider

//   // Transaction configuration
//   let gasLimit = 1800000;
//   let gasPrice

//   beforeEach(async function () {
//     provider = ethers.getDefaultProvider();

//     gasPrice = await provider.getGasPrice();

//     const accounts = await ethers.getSigners();
//     testAccountPrimary = accounts[0]
//     testAccountSecondary = accounts[1]

//     // Deploy dummy token contract
//     // Contract send entire balance to contract creator
//     const TokenDecimals = 18
//     let DegenLamboToken = await ethers.getContractFactory("LamboToken");
//     DegenLamboTokenContract = await DegenLamboToken.deploy("LamboToken", TokenDecimals);
//     await DegenLamboTokenContract.deployed();

//     // Deploy pre-sale distribution contract
//     let _presale = await ethers.getContractFactory("LamboPresale");
//     PreSaleContract = await _presale.deploy(DegenLamboTokenContract.address, TokenDecimals);
//     await PreSaleContract.deployed();

//     // send entire token balance to pre-sale contract
//     let tokenBalance = await DegenLamboTokenContract.balanceOf(testAccountPrimary.address);
//     await DegenLamboTokenContract.transfer(PreSaleContract.address, tokenBalance,{from:testAccountPrimary.address})

//   });

//   it("Should add addresses to whitelisted", async function(){
//     await PreSaleContract.addWhitelistAddresses([testAccountSecondary.address]);
//     expect(await PreSaleContract.isWhitelisted(testAccountSecondary.address)).to.equal(true);
//   });

//   it("Should allow whitelisted address to send investment for pre-sale", async function(){

//     const investmentLimit = await PreSaleContract.getPresaleInvestmentLimit()

//     await PreSaleContract.addWhitelistAddresses([testAccountSecondary.address]);
//     await PreSaleContract.startPresale()

//     await testAccountSecondary.sendTransaction({
//         gasLimit: gasLimit,
//         gasPrice: gasPrice,
//         to: PreSaleContract.address,
//         value: investmentLimit
//     });
//   });

//   it("Non whitelisted address is unable to send investment for pre-sale", async function(){

//     const investmentLimit = await PreSaleContract.getPresaleInvestmentLimit()

//     await PreSaleContract.startPresale()

//     await expect(
//         testAccountSecondary.sendTransaction({
//           gasLimit: gasLimit,
//           gasPrice: gasPrice,
//           to: PreSaleContract.address,
//           value: investmentLimit
//         })).to.be.revertedWith('Your address is not whitelisted');

//   });

//   it("Should not be able to invest if pre-sale has not started", async function (){
//     const investmentLimit = await PreSaleContract.getPresaleInvestmentLimit()

//     // await PreSaleContract.startPresale()

//     await expect(
//         testAccountSecondary.sendTransaction({
//           gasLimit: gasLimit,
//           gasPrice: gasPrice,
//           to: PreSaleContract.address,
//           value: investmentLimit
//         })).to.be.revertedWith('Presale is currently not active');

//   });

//   it("Should send invested Ether to owners address after pre-sale", async function (){
//     //todo use ether utils here...
//     const investmentLimit = await PreSaleContract.getPresaleInvestmentLimit()
//     const investmentLimitParsed = Number(ethers.utils.formatEther(investmentLimit))

//     let ownerEthBalanceBefore = await testAccountPrimary.getBalance();
//     const ownerEthBalanceBeforeParsed = Number(ethers.utils.formatEther(ownerEthBalanceBefore))

//     await PreSaleContract.addWhitelistAddresses([testAccountSecondary.address]);

//     await PreSaleContract.startPresale()

//     await testAccountSecondary.sendTransaction({
//       gasLimit: gasLimit,
//       gasPrice: gasPrice,
//       to: PreSaleContract.address,
//       value: investmentLimit
//     });

//     await PreSaleContract.endPresale()

//     let ownerEtherBalanceAfter = await testAccountPrimary.getBalance();
//     const ownerEtherBalanceAfterParsed = Number(ethers.utils.formatEther(ownerEtherBalanceAfter)).toFixed(2)

//     expect(ownerEtherBalanceAfterParsed).to.equal(Number(investmentLimitParsed + ownerEthBalanceBeforeParsed).toFixed(2))

//   });

//   it("Should send remaining pre-sale tokens to token contract", async function (){
//     //todo use ether utils here...
//     const investmentLimit = await PreSaleContract.getPresaleInvestmentLimit()

//     await PreSaleContract.addWhitelistAddresses([testAccountSecondary.address]);
//     await PreSaleContract.startPresale()

//     await testAccountSecondary.sendTransaction({
//       gasLimit: gasLimit,
//       gasPrice: gasPrice,
//       to: PreSaleContract.address,
//       value: investmentLimit
//     });

//     let presaleContractTokenBalanceBefore = await DegenLamboTokenContract.balanceOf(PreSaleContract.address);
//     const presaleContractTokenBalanceBeforeParsed = Number(ethers.utils.formatEther(presaleContractTokenBalanceBefore))

//     await PreSaleContract.endPresale()

//     let presaleContractTokenBalanceAfter = await DegenLamboTokenContract.balanceOf(PreSaleContract.address);
//     const presaleContractTokenBalanceAfterParsed = Number(ethers.utils.formatEther(presaleContractTokenBalanceAfter))

//     let TokenContractBalance = await DegenLamboTokenContract.balanceOf(DegenLamboTokenContract.address);
//     const TokenContractBalanceParsed = Number(ethers.utils.formatEther(TokenContractBalance))


//     expect(presaleContractTokenBalanceAfterParsed).to.equal(Number(0))
//     expect(TokenContractBalanceParsed).to.equal(presaleContractTokenBalanceBeforeParsed)

//   });

//   // it("Should allow developer whitelisted address to send investment 2.88 ETH for pre-sale", async function(){
//   //
//   //   // const balance = await testAccount.getBalance()
//   //   // console.log(ethers.utils.formatEther(balance))
//   //
//   //   await PreSaleContract.addWhitelistAddresses([testAccountPrimary.address]);
//   //   await PreSaleContract.addDevAddresses([testAccountPrimary.address]);
//   //
//   //   try {
//   //     let tx = await testAccountPrimary.sendTransaction({
//   //       gasLimit: gasLimit,
//   //       gasPrice: gasPrice,
//   //       to: PreSaleContract.address,
//   //       value: ethers.utils.parseEther("2.88")
//   //     });
//   //   } catch (e){
//   //     console.log("should be a error here", e.message)
//   //   }
//   // });

//   // it("Should refund everyone that invested in the pre-sale", async function (){
//   //
//   //   await PreSaleContract.addWhitelistAddresses([testAccountPrimary.address]);
//   //
//   //   let etherBalance = await testAccountPrimary.getBalance();
//   //   console.log("testAccountPrimary balance before: %s",etherBalance)
//   //
//   //   let tx = await testAccountPrimary.sendTransaction({
//   //     gasLimit: gasLimit,
//   //     gasPrice: gasPrice,
//   //     to: PreSaleContract.address,
//   //     value: ethers.utils.parseEther("0.5")
//   //   });
//   //
//   //   etherBalance = await testAccountPrimary.getBalance();
//   //   console.log("testAccountPrimary balance after investment: %s",etherBalance)
//   //
//   //   // const balance = await DegenLamboTokenContract.balanceOf(PreSaleContract.address);
//   //   // console.log("contract balance: %s", ethers.utils.formatEther(balance))
//   //
//   //   await PreSaleContract.refundInvestors();
//   //
//   //   etherBalance = await testAccountPrimary.getBalance();
//   //   console.log("testAccountPrimary balance after refund: %s", ethers.utils.formatEther(etherBalance))
//   //
//   // })

//   it("Developer should get 5.555 tokens for a 1ETH investment", async function(){

//     await PreSaleContract.addWhitelistAddresses([testAccountSecondary.address]);
//     await PreSaleContract.addDevAddresses([testAccountSecondary.address]);
//     await PreSaleContract.startPresale()

//     await testAccountSecondary.sendTransaction({
//         gasLimit: gasLimit,
//         gasPrice: gasPrice,
//         to: PreSaleContract.address,
//         value: ethers.utils.parseEther("1")
//     });

//     let tokenBalance = await DegenLamboTokenContract.balanceOf(testAccountSecondary.address);
//     // expect(tokenBalance).to.equal(5.555555555555555555)
//     // console.log("tokenBalance is %s", ethers.utils.formatEther(tokenBalance))

//     const owner = await PreSaleContract.owner()
//     // console.log("Owner is %s", owner)
//     // console.log("testAccountPrimary.address is %s", testAccountPrimary.address)

//     const PresaleContractLamboBalance = await DegenLamboTokenContract.balanceOf(PreSaleContract.address);
//     // console.log("PresaleContractLamboBalance lambo token balance: %s", PresaleContractLamboBalance)

//     const balance = await DegenLamboTokenContract.balanceOf(testAccountPrimary.address);
//     // console.log("TestAccountPrimary lambo token balance: %s", ethers.utils.formatEther(balance))

//     const ethBalanceInvested = await PreSaleContract.getInvestedAmount(testAccountPrimary.address)
//     // console.log("balanceOnContract lambo token balance: %s", ethers.utils.formatEther(ethBalanceInvested))
//   });
// });