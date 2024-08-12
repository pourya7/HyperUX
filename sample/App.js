import React from 'react';
import { withHyperUX } from '../hyperux-sdk/hyperux-react';

function App() {
    return (
        <div className="dashboard">
            <h1>FinTech Dashboard</h1>
            <div className="account-balance">
                <h2>Account Balance</h2>
            </div>
            <div className="transaction-buttons">
                <button>Deposit $100</button>
                <button>Withdraw $50</button>
            </div>
            <div className="recent-transactions">
                <h2>Recent Transactions</h2>
            </div>
        </div>
    );
}

export default withHyperUX(App);