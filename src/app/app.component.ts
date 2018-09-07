import { Component, OnInit } from '@angular/core';
import {Web3Service} from './util/web3.service';
import { tryCatch } from '../../node_modules/rxjs/internal/util/tryCatch';

declare let require: any;
const collect_artifacts = require('../../build/contracts/Collectables.json');
const Web3 = require('web3');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  currentAccount = 'Connecting to web3...';
  accountName: string = '';
  isCollector: boolean = false;
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
      this.getIsCollector();
      this.getAccountName();
    });
  }

  async watchRegistration() {
    if (!this.Collectables) {
      console.log('Collectables is not loaded, unable to watch event');
      return;
    }
    console.log('Waiting for Rego event');
    const collectables = await this.Collectables.deployed();
    var event = collectables.RegistrationConfirmed();
    //var registeredAddr;
    await event.watch((err, res) => {
      console.log('Rego event received ' + res.args.sender);
      console.log('Current account ' + this.currentAccount);
      //registeredAddr = res.args.sender;
      if(res.args.sender === Web3.utils.toHex(this.currentAccount) {
        console.log('address match');
        this.getIsCollector();
        this.getAccountName();
      }
    });    
  }

  async getAccountName() {
    if (!this.Collectables) {
      console.log('Collectables is not loaded, unable to send transaction');
      return;
    }

    try {
      const collectables = await this.Collectables.deployed();
      // cant read class vars in here - console.log(this.isCollector);
      const collector = await collectables.collectors(this.accounts[0]);
      this.accountName = collector[0];
      console.log("Get Collector Name: " + collector[0]);
    } catch (e) {
      console.log("Get Collector failed with: " + e.message.toString());
    }  
  }

  async getIsCollector() {
    if (!this.Collectables) {
      console.log('Collectables is not loaded, unable to send transaction');
      return;
    }
    try {
      const collectables = await this.Collectables.deployed();
      this.isCollector = false; // set to false before call
      this.isCollector = await collectables.isCollector(this.accounts[0]);
    } catch (e) {
      console.log("GetIsCollector failed with: " + e.message.toString());     
    }
  }

  async register(name: string) {
    console.log('Register function called: ' + name); 
    if (!this.Collectables) {
      console.log('Collectables is not loaded, unable to send transaction');
      return;
    } 
    try {
      const collectables = await this.Collectables.deployed();
      this.watchRegistration();
      await collectables.addCollector(name, {from: this.accounts[0]});
      console.log('Register called: ' + name);
    } catch (e) {
      console.log("AddCollector failed with: " + e.message.toString());     
    }  
  }
}
