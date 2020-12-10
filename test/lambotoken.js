const LamboToken = artifacts.require("LamboToken");
var chai = require('chai');

//////
///// Note: Some of the tests below are commented out. This is because we used a different system to feed
/////   data into the contract to act like the Uniswap Oracle. As such, now that the contract is 
/////   fully updated to integrate with Uniswap on the mainnet, these tests are deprecated.
//      They are included for posterity.
/////
//////

const { expect, assert } = require('chai');
const { should } = require('chai').should();

const {
  BN,
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,
  expectRevert,
  ether,
  time
} = require('@openzeppelin/test-helpers');


contract("LamboToken", accounts => {

    let instance;

    //1 ether big number
    let oneEther = new BN('1000000000000000000');

    //Three named accounts given
    let ownerAddress = accounts[0];
    let initDistributionAddress = ownerAddress;
    let exchangeAddy = accounts[5];
    let stakingContractAddress = accounts[8];

    let stranger1Address = accounts[3];
    let stranger2Address = accounts[4];
    let stranger3Address = accounts[6];
    let stranger4Address = accounts[7];

    //Token contract init values
    const MECHANIC_PCT = new BN(25);
    const deltaTWAPLong = 172800;
    const deltaTWAPShort = 120;

    //Addresses init values
    const initDistAddyBalance = new BN('380000000000000000000');
    const initcontractBalance = new BN('1669000000000000000000');

    it("creates a token with correct parameters and balances", async() => {
        instance = await LamboToken.deployed();
        // presaleInstance = await LamboPresale.deployed();
        expect(await instance.MECHANIC_PCT()).to.be.bignumber.equal(new BN(MECHANIC_PCT));
        expect(await instance.minDeltaTwapLong()).to.be.bignumber.equal(new BN(deltaTWAPLong));
        expect(await instance.minDeltaTwapShort()).to.be.bignumber.equal(new BN(deltaTWAPShort));
        expect(await instance.balanceOf(initDistributionAddress)).to.be.bignumber.equal(initDistAddyBalance);
        expect(await instance.balanceOf(instance.address)).to.be.bignumber.equal(initcontractBalance);
    });

    it("allows initdistributionaddress to send transfer before unpause", async() =>{
        let receiverAddress = stranger1Address;
        let senderAddress = initDistributionAddress;

        let sender_init_balance = await instance.balanceOf.call(senderAddress);
        let amountToTransfer = sender_init_balance.div(new BN('2')); // Amount to be removed from init distribution address

        // //Transfer the tokens
        const receipt =  await instance.transfer(receiverAddress, amountToTransfer, {from: senderAddress});

        //Verify a transfer was emitted
        expectEvent(receipt, 'Transfer', {
            from: senderAddress,
            to: receiverAddress,
            value: amountToTransfer,
        });

        //Expected sender balance
        const expectedSenderBalance = sender_init_balance.sub(amountToTransfer);
        // console.log("Sender Expected Final Balance: " + expectedSenderBalance.toString())

        //Verify the actual balances of the senders and receivers with the expected
        expect(await instance.balanceOf(senderAddress))
             .to.be.bignumber.equal(expectedSenderBalance);
        expect(await instance.balanceOf(receiverAddress))
             .to.be.bignumber.equal(amountToTransfer);
    });
    
    it("denies transfer by non-initdistributionaddress before unpause", async() =>{
        let receiverAddress = stranger2Address;
        let senderAddress = stranger1Address;

        let amountToTransfer = new BN('100000000000000000000'); // Amount to be removed from init distribution address

        // //Transfer the tokens
        await expectRevert(
            instance.transfer(receiverAddress, amountToTransfer, {from: senderAddress}),
            "!paused && !initialDistributionAddress -- Reason given: !paused && !initialDistributionAddress.");
    });

    it("non-owner can't unpause the contract", async () => {
        //Unpause the contract with a tx from ownerAddress
        await expectRevert(
            instance.unpause({from: stranger1Address}),
            "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.");
    });

    it("sets the max buy bonus percentage", async() => {
        //The new MBBP
        let MBBP = new BN('69');

        //Send TX and catch receipt
        let receipt = await instance.setMaxBuyBonusPercentage(MBBP);

        //Check that expected event occured
        expectEvent(receipt, 'MaxBuyBonusUpdated', {
            new_MBB: MBBP
        });

        //Compare the returned value from the contract with the one we sent
        expect(await instance.maxBuyBonus()).to.be.bignumber.equal(MBBP);
    });

    it("Lets the owner change the deltaTwap values", async() => {
        let newLongDelta = new BN('1000');
        let newShortDelta = new BN('100');

        let receipt = await instance.setMinDeltaTwap(newLongDelta, newShortDelta);

        expect(await instance.minDeltaTwapLong()).to.be.bignumber.equal(newLongDelta);
        expect(await instance.minDeltaTwapShort()).to.be.bignumber.equal(newShortDelta);
    });

    it("non-owner can't set the max buy bonus percentage", async() => {
        //The new MBBP
        let MBBP = new BN('69');

        //Send TX and catch receipt
        await expectRevert(
            instance.setMaxBuyBonusPercentage(MBBP, {from: stranger1Address}), 
            "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.");
    });

    it("sets the percent going to mechanics", async() => {
        //The new mechanics_pct
        let mechanics_pct = new BN('25');

        //Send TX and catch receipt
        let receipt = await instance.setMechanicPercent(mechanics_pct);

        //Check that expected event occured
        expectEvent(receipt, 'MechanicPercentUpdated', {
            new_mechanic_PCT: mechanics_pct
        });

        //Compare the returned value from the contract with the one we sent
        expect(await instance.MECHANIC_PCT()).to.be.bignumber.equal(mechanics_pct);
    })

    it("non-owner can't set the percent going to mechanics", async() => {
        //The new mechanics_pct
        let mechanics_pct = new BN('35');

        //Send TX and catch receipt
        await expectRevert(
            instance.setMechanicPercent(mechanics_pct, {from: stranger1Address}), 
            "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.");
    });

    it("owner unpauses the contract", async () => {
        //Unpause the contract with a tx from ownerAddress
        let receipt = await instance.unpause({from: ownerAddress});

        expectEvent(receipt, 'Unpaused', {
            account: ownerAddress
        });
        // console.log(receipt);

        let isPaused = await instance.paused();

        assert.equal(isPaused, false, "Unpause failed.");
    });

    it("non-initdistr address transfers value properly, emits transfer", async() => {
        
        let receiverAddress = exchangeAddy; //random
        let senderAddress = stranger1Address;

        //Save balance before transaction
        let sender_init_balance = await instance.balanceOf.call(senderAddress);
        // console.log("Sender Initial Balance: " + sender_init_balance.toString())
        let amountToTransfer = sender_init_balance; //Send the entire balance

        //Make sure starting balances are correct before testing transfer
        expect(await instance.balanceOf(receiverAddress))
             .to.be.bignumber.equal(new BN(0));

        // //Transfer the tokens
        const receipt =  await instance.transfer(receiverAddress, amountToTransfer, {from: senderAddress});

        //Verify a transfer was emitted
        expectEvent(receipt, 'Transfer', {
            from: senderAddress,
            to: receiverAddress,
            value: amountToTransfer,
        });

        //Expected sender balance
        const expectedSenderBalance = sender_init_balance.sub(amountToTransfer);
        // console.log("Sender Expected Final Balance: " + expectedSenderBalance.toString())

        //Verify the actual balances of the senders and receivers with the expected
        expect(await instance.balanceOf(senderAddress))
             .to.be.bignumber.equal(expectedSenderBalance);
        expect(await instance.balanceOf(receiverAddress))
             .to.be.bignumber.equal(amountToTransfer);
    });

    it("correctly sets an exchange address", async() => {

        const receipt = await instance.setExchangeAddress(exchangeAddy, true, {from: ownerAddress});

        //Verify an exchange list update occured
        expectEvent(receipt, 'ExchangeListUpdated', {
            exchangeAddress: exchangeAddy,
            isExchange: true,
        });

        expect(await instance.isExchangeAddress(exchangeAddy, {from: stranger1Address})).to.be.equal(true);
    });

    // it("emits a bonus amount update when transferring OUT of an exchange address", async() => {

    //     //Send half of the exchange's balance to someone (Someone bought half of all tokens on market)
    //     let transfer_amount = new BN('1000000000000000000');

    //     //Perform the transfer (buy order)
    //     await debug(await instance.transfer(stranger3Address, transfer_amount, {from: exchangeAddy}));
    //     const receipt =  await instance.transfer(stranger3Address, transfer_amount, {from: exchangeAddy});

    //     //Check that the bonus amount was updated
    //     expectEvent(receipt, 'BonusBalanceUpdated', {
    //         userAddress: stranger3Address,
    //         newAmount: new BN('1000000000000000000'), // 1 $LAMBO
    //     });
    // });

    it("correctly reads zero for a bonus unlock time in bonus tokens", async() => {
        expect(await instance.getBonusUnlockTime(stranger4Address)).to.be.bignumber.equal(new BN('0'));
    });

    it("correctly reads zero for a bonus amount in bonus tokens", async() => {
        expect(await instance.getBonusAmount(stranger4Address)).to.be.bignumber.equal(new BN('0'));
    });

    // it("correctly set block number for a bonus unlock time in bonus tokens", async() => {
    //     //There should be 16 blocks at this point in the test net + 1 delta block = 17
    //     expect(await instance.getBonusUnlockTime(stranger3Address)).to.be.bignumber.equal(new BN('19'));
    // });

    // it("correctly set a bonus amount in bonus tokens", async() => {
    //     expect(await instance.getBonusAmount(stranger3Address)).to.be.bignumber.equal(new BN('1000000000000000000'));
    // });

    it("sets the staking contract address", async() => {
        const receipt = await instance.setStakingContractAddress(stakingContractAddress);

        expectEvent(receipt, 'StakingContractAddressUpdated', {
            newStakingAddress: stakingContractAddress,
        })
    });
    
    // it ("properly allows a user to claim their bonus tokens", async() => {
    //     //Calculate ahead of time what the final balance should be by adding together the bonus balance and the init balance
    //     let sender_init_balance = await instance.balanceOf.call(stranger3Address);
    //     let initBonusBalance = await instance.getBonusAmount(stranger3Address);

    //     let expectedBuyerBalance = sender_init_balance.add(initBonusBalance);

    //     //Calculate the balance of the contract after the tx ahead of time
    //     let contractInitBalance = await instance.balanceOf.call(instance.address);

    //     let expectedContractBalance = contractInitBalance.sub(initBonusBalance);

    //     //Perform the bonus claim
    //     const receipt = await instance.claimBonusTokens({from: stranger3Address});

    //     //Check that the bonus amount was updated to be zero
    //     expectEvent(receipt, 'BonusBalanceUpdated', {
    //         userAddress: stranger3Address,
    //         newAmount: new BN('0'), // 0 $LAMBO
    //     });

    //     //Verify a transfer was emitted
    //     expectEvent(receipt, 'Transfer', {
    //         from: instance.address,
    //         to: stranger3Address,
    //         value: initBonusBalance,
    //     });

    //     expectEvent(receipt, 'BuyerBonusPaid', {
    //         receiver: stranger3Address,
    //         bonusAmount: initBonusBalance,
    //     });

    //     //Check that the balances are what they should be
    //     expect(await instance.balanceOf.call(stranger3Address)).to.be.bignumber.equal(expectedBuyerBalance);
    //     expect(await instance.balanceOf.call(instance.address)).to.be.bignumber.equal(expectedContractBalance);
    // });

    // it("correctly implements nitro protocol on sell orders", async() => {
    //     //mark down the starting balances of the 
    //     // - User account
    //     let user_init_balance = await instance.balanceOf.call(stranger3Address);

    //     // - Exchange address
    //     let exchange_init_balance = await instance.balanceOf.call(exchangeAddy);

    //     // - Contract address
    //     let contract_init_balance = await instance.balanceOf.call(instance.address);

    //     // - Staking address
    //     let staking_init_balance = await instance.balanceOf.call(stakingContractAddress);

    //     //Calculate the expected balances for all three accounts 
    //     //    I'm transferring from the user account to the exchange, so I expect:
    //     //    User account balance changes by transfer amount
    //     let amountToTransfer = user_init_balance.div(new BN('2'));
    //     let expected_user_balance = user_init_balance.sub(amountToTransfer);
    //     //    Exchange balance changes by nonzero amount
    //     //    Staking balance changes by nonzero amount
    //     //    Contract balance changes by nonzero amount
    //     //          Staking+Contract+exchange changes = transfer amount
    //     //          Change in contract balance is (1-MECHANIC_PCT)/MECHANIC_PCT change in staking balance
    //     let expected_multiple = new BN('100').sub(MECHANIC_PCT).mul(new BN('100')).div(MECHANIC_PCT);

    //     //Perform the transaction
    //     const receipt =  await instance.transfer(exchangeAddy, amountToTransfer, {from: stranger3Address});
 
    //     //Expected Events:
    //     // - Transfer to the nitro protocol
    //     expectEvent(receipt, 'Transfer', {
    //         from: stranger3Address,
    //         to: instance.address,
    //     }); // - Transfer to the staking contract
    //     expectEvent.inTransaction(receipt.tx, LamboToken, 'Transfer', {
    //         from: stranger3Address,
    //         to: stakingContractAddress,
    //     }); // - The actual requested transfer to the exchange
    //     expectEvent.inTransaction(receipt.tx, LamboToken, 'Transfer', {
    //         from: stranger3Address,
    //         to: exchangeAddy,
    //     });

    //     //////Check the balances
    //     //Check expected user balance
    //     expect(await instance.balanceOf(stranger3Address))
    //          .to.be.bignumber.equal(expected_user_balance);

    //     //Check exchange balance
    //     let exchange_balance_delta = (await instance.balanceOf(exchangeAddy)).sub(exchange_init_balance);
    //     expect(exchange_balance_delta).to.be.bignumber.not.equal(new BN('0'));

    //     //Check staking balance
    //     let staking_balance_delta = (await instance.balanceOf(stakingContractAddress)).sub(staking_init_balance);
    //     expect(staking_balance_delta).to.be.bignumber.not.equal(new BN('0'));

    //     //Check nitro staking balance
    //     let nitro_balance_delta = (await instance.balanceOf(instance.address)).sub(contract_init_balance);
    //     expect(staking_balance_delta.mul(expected_multiple).div(new BN('100'))).to.be.bignumber.equal(nitro_balance_delta);

    //     //Check that no new tokens were minted or destroyed
    //     expect(exchange_balance_delta.add(staking_balance_delta).add(nitro_balance_delta)).to.be.bignumber.equal(amountToTransfer);
    // });

    // it("returns the \"correct price\" for a trading pair", async() => {
    //     expect(await instance.realtimePrice())
    //         .to.be.bignumber.equal(new BN('0'));
    // });

    it("Instantiated the uniswap pair address", async() => {
        let pairAddress = await instance.uniswapPair();
        assert.typeOf(pairAddress, 'string');
    });

    // it("Reads the correct Nitro rate given the simulated conditions", async() => {
    //     let currentNitroRate = await instance.calculateCurrentNitroRate(false);
    //     let fractionalRate = currentNitroRate.mul(new BN('10000')).div(oneEther);
    //     console.log("Current Nitro rate: " + fractionalRate + "/100 %");
    //     expect(currentNitroRate)
    //         .to.be.bignumber.equal(new BN('63800000000000000'));
    // });
});

    
