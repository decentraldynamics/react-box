import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";

import "./App.css";

var truffle_contract = require("truffle-contract");

class App extends Component {
  state = { 
    web3: null, 
    accounts: null, 
    storage_contract: null,
  };

  componentDidMount = async () => {
    let web3;
    try {
      // Get network provider and web3 instance.
      web3 = await getWeb3();
    } catch (error) {
      console.error(error);
      alert(
        `Something went wrong getting web3: ` + error,
      );
      return;
    }

    let accounts;
    try {
      accounts = await web3.eth.getAccounts();
    } catch (error) {
      console.error(error);
      alert(
        `Something went wrong loading accounts from [` + 
        web3.currentProvider.host + 
        `]: ` + 
        error,
      );
      return;
    }

    try {
      // We're just going the store the 'spec' of the contract. It not a
      // particular instance of a deployed contract. Need the address to do that
      var storage_contract_spec = truffle_contract(SimpleStorageContract);
      storage_contract_spec.setProvider(web3.currentProvider);
      var storage_contract = await storage_contract_spec.deployed();
      
      // Set web3, accounts, and contract to the state so that other 
      // components can access it
      this.setState({ web3, accounts, storage_contract });
      
    } catch (error) {
      console.error(error);
      alert(
        `Something went wrong loading the contract: ` + error,
      );
      return;
    }
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    let cp = this.state.web3.currentProvider;
    let connection_status;
    if (cp.isMetaMask) {
      connection_status = 
        <div>
          <h5>Connected to MetaMask...</h5>
          <ul>
            <li><code>web3.currentProvider.isMetaMask</code>: {cp.isMetaMask.toString()}</li>
            <li><code>web3.currentProvider.isConnected()</code>: {cp.isConnected().toString()}</li>
            <li><code>web3.currentProvider.selectedAddress</code>: {cp.selectedAddress}</li>
          </ul>
        </div>;
    } else {
      connection_status = 
        <div>
          <h6>Connected to local provider...</h6>
          <ul>
            <li><code>web3.currentProvider.connected</code>: {cp.connected.toString()}</li>
            <li><code>web3.currentProvider.host</code>: {cp.host.toString()}</li>
          </ul>
        </div>;
    }
    return (
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h3>React+Data Starter Box</h3>
            <hr/>
          </div>
        </div>

        <div id="simple_storage_box" className="row">
        <div className="col-12">
          <div className="panel panel-default">
          

            <div className="panel-body">
              <h4>web3</h4>
              {connection_status}

              <hr/>

              <h4>SimpleStorage</h4>
              <ul>
                <li><code>storage_contract.address</code>: {this.state.storage_contract.address}</li>
              </ul>

              <h5>SimpleStorage.setInt</h5>
              <ValueToStoreForm 
                storage_contract={this.state.storage_contract} 
                account={this.state.accounts[0]} />

              <h5>SimpleStorage.getInt</h5>
              <GetStoredValue
                storage_contract={this.state.storage_contract} 
                account={this.state.accounts[0]} />    

            </div>

          </div>
        </div>
      </div>
    </div>
    );
  }
}

export default App;

class ValueToStoreForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.input = React.createRef();
    this.state = {
      storage_contract: this.props.storage_contract,
      account: this.props.account,
      transactionHash: "nothing yet",
      blockHash: "nothing yet",
      blockNumber: "nothing yet",
      gasUsed: "nothing yet",
      error_text: "",
    }
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState({error_text: "",});

    const { account, storage_contract } = this.state;

    var to_store = this.input.current.value;
    console.log("data: " + to_store);

    try {
      const set_response = await storage_contract.setInt(to_store, { from: account });
      this.setState({ 
        transactionHash: set_response.tx,
        blockHash: set_response.receipt.blockHash,
        blockNumber: set_response.receipt.blockNumber,
        gasUsed: set_response.receipt.gasUsed,
        logs: set_response.receipt.logs,
       });  
    } catch(error) {
			console.log(error)
      this.setState({error_text: error.toString(),});
    }

  }


  render() {
    const error_message = this.state.error_text ?
      <div className="alert alert-danger" role="alert">{this.state.error_text}</div> : "";

    const events_data = this.state.logs ?
      <ul>
        <li><code>logs[0].event</code>: {this.state.logs[0].event}</li>
        <li><code>logs[0].args.new_value</code>: {this.state.logs[0].args.new_value.toString()}</li>
        <li><code>logs[0].args.old_value</code>: {this.state.logs[0].args.old_value.toString()}</li>
      </ul>
      : "nothing yet";

    return (
      <div>
        {error_message}
        <form onSubmit={this.handleSubmit}>

            <div className="row">
              <div className="col-sm-1">
                <input id="to_store" name="to_store" type="text" className="form-control form-control-sm" placeholder="a uint" ref={this.input} />
              </div>
              <div className="col">
                <button className="btn-primary btn-sm" type="submit">setInt(..)</button>
              </div>
            </div>

        </form>
        <ul>
          <li><code>response.tx</code>: {this.state.transactionHash}</li>
          <li><code>response.receipt.blockHash</code>: {this.state.blockHash}</li>
          <li><code>response.receipt.blockNumber</code>: {this.state.blockNumber}</li>
          <li><code>response.receipt.gasUsed</code>: {this.state.gasUsed}</li>
          <li><code>response.receipt.logs</code>: {events_data}</li>
        </ul>
      </div>
    );
  }
}
class GetStoredValue extends React.Component {
  constructor(props) {
    super(props);
    this.handleGet = this.handleGet.bind(this);
    this.state = {
      stored_value: "?",
      storage_contract: this.props.storage_contract,
      account: this.props.account,
      error_text: "",
    }
  }

  handleGet = async (event) => {    
    event.preventDefault();
    const storage_contract = this.state.storage_contract;

    try {
      const response = await storage_contract.getInt.call();

      this.setState({ stored_value: response.toNumber() });
    } catch(error) {
			console.log(error)
      this.setState({error_text: error.toString(),});
    }


  }

  render() {
    const error_message = this.state.error_text ?
      <div className="alert alert-danger" role="alert">{this.state.error_text}</div> : "";

    return (
      <div>
        {error_message}
        <div className="row">
          <div className="col-sm-1">
            <button type="submit" onClick={this.handleGet} className="btn btn-primary btn-sm">getInt()</button>
          </div>
          <div className="col-sm-1">
            {this.state.stored_value}
          </div>
        </div>
      </div>
    );
  }
}

