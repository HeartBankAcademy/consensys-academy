import {Component, Injectable, OnInit} from '@angular/core';
import {Web3Service} from '../../util/web3.service';
//import { MatSnackBar } from '@angular/material';
import {FlatTreeControl} from '@angular/cdk/tree';
//import {Component, Injectable} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject, Observable, of as observableOf} from 'rxjs';
import { delayWhen } from '../../../../node_modules/rxjs/operators';


declare let require: any;
const collect_artifacts = require('../../../../build/contracts/Collectables.json');

/**
 * File node data with nested structure.
 * Each node has a filename, and a type or a list of children.
 */
export class CollectionNode {
  children: CollectionNode[];
  name: string;
  type: any;
}

/** Flat node with expandable and level information */
export class CollectionFlatNode {
  constructor(
    public expandable: boolean, public name: string, public level: number, public type: any) {}
}

//@Injectable()
export class CollectionStorage {
  dataChange = new BehaviorSubject<CollectionNode[]>([]);
  Collectables: any;
  CategoryNodes: CollectionNode[];
  accounts: string[];
 
    get data(): CollectionNode[] { return this.dataChange.value; }

    constructor(private web3Service: Web3Service) {
      console.log('Constructor: ' + web3Service);
      this.CategoryNodes = [];
    }

    async initialize() {
      console.log('OnInit: ' + this.web3Service);
      console.log(this);
      // TODO currently no observable events when adding categories or collections so implement some sort of watch when their is
      this.watchAccount();
      this.web3Service.artifactsToContract(collect_artifacts)
        .then((CollectAbstraction) => {
          this.Collectables = CollectAbstraction;
          console.log('Collectables is set');
        });
    
      // Build the tree nodes from Ethereum. The result is a list of `CollectionNode` with nested collection node as children.
      //const data = this.buildFileTree(dataObject, 0);
      await this.delay(11000); // after accounts are refreshed, will reduce this later
      // TODO will need a temp bootstrap function to setup category and collections
      this.getCategories();
      //await this.delay(300);
      this.getCollections();

      // Notify the change.
      this.dataChange.next(this.CategoryNodes);
    }

    delay(ms: number) {
      return new Promise( resolve => setTimeout(resolve, ms) );
    }

    watchAccount() {
      this.web3Service.accountsObservable.subscribe((accounts) => {
        this.accounts = accounts;
      });
    }

    async getCategories() {
      if (!this.Collectables) {
        console.log('Collectables is not loaded, unable to send transaction');
        return;
      }
      try {
        const collectables = await this.Collectables.deployed();
        const test = "TEST";
        await collectables.addCategory(test, {from: this.accounts[0]});
 
        const categoryCount = await collectables.getNumberOfCategories();
        console.log(categoryCount.toString(10));

        for (var i=0; i<categoryCount; i++) {
          const category = await collectables.categories(i);
          const node = new CollectionNode();
          node.name = category;
          node.type = 'Category';
          this.CategoryNodes.push(node);
        }
        console.log(this);
      } catch (e) {
        console.log(e);
      }    
    }

    async getCollections() {
      if (!this.Collectables) {
        console.log('Collectables is not loaded, unable to send transaction');
        return;
      }
      try {
        const collectables = await this.Collectables.deployed();
        //console.log(this);
        for (var catIndex=0; catIndex<this.CategoryNodes.length; catIndex++) {
          const category = this.CategoryNodes[catIndex].name;
          const count = await collectables.getNumberOfCollectionsForCategory(category);
          this.CategoryNodes[catIndex].children = [];

          for (var i=0; i<count; i++) {
            const collection = await collectables.getCollectionDetailsByIndex(category, i);

            const node = new CollectionNode();
            node.name = collection[0];
            node.type = 'Collection';
            this.CategoryNodes[catIndex].children.push(node);
          }
        
        }
       
      } catch (e) {
        console.log(e);
      }    
    }
}

@Component({
  selector: 'app-collect-browser',
  templateUrl: './collect-browser.component.html',
  styleUrls: ['./collect-browser.component.css'],
 // providers: [CollectionStorage]
})
export class CollectBrowserComponent implements OnInit {
  treeControl: FlatTreeControl<CollectionFlatNode>;
  treeFlattener: MatTreeFlattener<CollectionNode, CollectionFlatNode>;
  dataSource: MatTreeFlatDataSource<CollectionNode, CollectionFlatNode>;
  cs: CollectionStorage;

  constructor(private web3Service: Web3Service) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: '); //+ this.web3Service);
    //console.log(this);
    this.cs = new CollectionStorage(this.web3Service);
    this.cs.initialize();

    this.treeFlattener = new MatTreeFlattener(this.transformer, this._getLevel,
    this._isExpandable, this._getChildren);
    this.treeControl = new FlatTreeControl<CollectionFlatNode>(this._getLevel, this._isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this.cs.dataChange.subscribe(data => this.dataSource.data = data);

  }

  transformer = (node: CollectionNode, level: number) => {
    return new CollectionFlatNode(!!node.children, node.name, level, node.type);
  }

  private _getLevel = (node: CollectionFlatNode) => node.level;

  private _isExpandable = (node: CollectionFlatNode) => node.expandable;

  private _getChildren = (node: CollectionNode): Observable<CollectionNode[]> => observableOf(node.children);

  hasChild = (_: number, _nodeData: CollectionFlatNode) => _nodeData.expandable;

}
