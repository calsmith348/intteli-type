import React from 'react';
import IntelliBox from '../../components/IntelliBox/IntelliBox'
import './App.css';

function App() {
  const tableList = () => {
		return '{"Tables": ["Products", "Periods", "ProductionPolicies", "ProcurementPolicies", "ProcurementOrders", "ProductionOrders", "ProductionConstraints", "ProductUnitsOfMeasure"],"products": ["unitvalue", "unitvolume", "unitprice", "unitweight", "unitlength", "unitwidth", "unitheight", "notes"],"periods": ["periodname", "startdate", "notes"]}';
	}
  return (
    <div className="App">
      <IntelliBox tableList = {tableList} />
    </div>
  );
}

export default App;
