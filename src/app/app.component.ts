import { Component, OnInit } from '@angular/core';
import {Web3Service} from './util/web3.service';

declare let require: any;
const collect_artifacts = require('../../build/contracts/Collectables.json');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  currentAccount = 'Connecting to web3...';
  accountName = '';
  accounts: string[];
  Collectables: any;

  constructor(private web3Service: Web3Service) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: ' + this.web3Service);
    this.watchAccount();
    this.web3Service.artifactsToContract(collect_artifacts)
        .then((CollectAbstraction) => {
          this.Collectables = CollectAbstraction;
          console.log('Collectables is set');
        });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.currentAccount = accounts[0];
      this.getAccountName();
    });
  }

  async getAccountName() {
    if (!this.Collectables) {
      console.log('Collectables is not loaded, unable to send transaction');
      return;
    }

    try {
      const collectables = await this.Collectables.deployed();
      const collector = await collectables.collectors(this.accounts[0]);
      this.accountName = collector[0];
      console.log("Get Collector Name: " + collector[0]);
    } catch (e) {
      console.log("Get Collector failed with: " + e.message.toString());
    }  
  }
}
