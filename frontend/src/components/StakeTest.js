import React from "react";

export function StakeTest({ stakeFunds }) {
  return (
    <div>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const amount = formData.get("amount");

          if (amount) {
            stakeFunds(amount);
          }
        }}
      >
        <div className="form-group">
          <label>Amount</label>
          <input
            className="form-control"
            type="number"
            step="100"
            name="amount"
            placeholder="Amount to Stake"
            required
          />
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="StakeFunds" />
        </div>
      </form>
    </div>
  );
}
