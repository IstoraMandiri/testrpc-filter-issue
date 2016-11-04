/* eslint-env mocha */
import assert from 'assert';
import Web3 from 'web3';
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const binary = '0x606060405260d08060106000396000f3606060405260e060020a6000350463482bac20811460265780639874090814607a575b6002565b3460025760ce600435602435604435604080518481526020810184905280820183905290517f38b8d246e48bae93eb35a8a76d5ec00252c994cfe4a861881828e5d061b37ef69181900360600190a1505050565b3460025760ce600435602435604435604080518481526020810184905280820183905290517f83fb17373dee8069f4d182a0ff2ab762389c92108633eedaf803f5f66e19e2619181900360600190a1505050565b00';
const abi = [{"constant":false,"inputs":[{"name":"_a","type":"uint256"},{"name":"_b","type":"uint256"},{"name":"_c","type":"uint256"}],"name":"triggerA","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_a","type":"uint256"},{"name":"_b","type":"uint256"},{"name":"_c","type":"uint256"}],"name":"triggerB","outputs":[],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_a","type":"uint256"},{"indexed":false,"name":"_b","type":"uint256"},{"indexed":false,"name":"_c","type":"uint256"}],"name":"EventA","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_c","type":"uint256"},{"indexed":false,"name":"_d","type":"uint256"},{"indexed":false,"name":"_e","type":"uint256"}],"name":"EventB","type":"event"}];

describe('Reproduce bug', function () {
  this.timeout(0);
  let contract;
  let account;
  before((done) => {
    web3.eth.getAccounts(function (err, res) {
      account = res[0];
      const Contract = web3.eth.contract(abi);
      contract = Contract.new({ data: binary, from: account, gas: 300000 }, () => {
        if (contract.address) { done(); }
      });
    });
  });

  describe('web3 raw', function () {
    // low-fi promise wrapper to ease testing in series
    function transact(method, args) {
      return new Promise((resolve) => {
        method.apply(method, [...args, { from: account, gas: 300000 }, function () {
          // just time rather than polling to make debugging easier
          setTimeout(resolve, 1000 * 5);
          // alternatively, wait for tx to get mined, or use:
          // const filter = web3.eth.filter('pending');
          // filter.watch(() => {
          //   // to get the async library out...
          //   web3.eth.getTransactionReceipt(txHash, (err3, receipt) => {
          //     if (receipt && receipt.transactionHash === txHash) {
          //       filter.stopWatching();
          //       resolve();
          //     }
          //   });
          // });
        }]);
      });
    }

    it('fires event a once', function (done) {
      let triggerCount = 0;
      const watcher = contract.EventA('pending', (error, result) => {
        triggerCount++;
        console.log('EVENT A fired', result);
      });
      setTimeout(() => {
        transact(contract.triggerA, [1, 2, 3])
        .then(() => {
          setTimeout(() => {
            console.log('web3 DONE WITH A');
            watcher.stopWatching(() => {
              assert.equal(triggerCount, 1);
              console.log('we stopped filtering A!');
              done();
            });
          }, 500);
        });
      }, 20);
    });

    it('fires event b once', function (done) {
      let triggerCount = 0;
      const watcher = contract.EventB('pending', (error, result) => {
        triggerCount++;
        console.log('EVENT B fired', result);
      });
      // setTimeout(() => {
        transact(contract.triggerB, [4, 5, 6])
        .then(() => {
          setTimeout(() => {
            console.log('web3 DONE WITH B')
            watcher.stopWatching(function () {
              console.log('we stopped filtering B!')
              assert.equal(triggerCount, 1);
              done();
            });
          }, 500);
        });
      // }, 10);
    });

    it('ensures the test ends asyncronously', function () {
      console.log('tests completed');
      assert.ok(1);
    });
  });
});
