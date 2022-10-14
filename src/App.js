import {useState, useEffect, useRef} from 'react';
 

const FetchConstants = {
  baseURL: 'https://openexchangerates.org/api/',
  app_id: '0f6288f8f4b4421ba1a18cf74a5b9dcf'
}

// this should probably be changed to be a state variable,
// but several design decision possibilities are under consideration
const currencyData = {
  convertFrom: 'USD',
  convertTo: ['EUR', 'GBP', 'CNY', 'BGN', 'AED'],
  rates: {},
  fullNames: {},
}

function App() {
  // references are utilized for the purpose of managing focus of filters (text input) and the related select boxes only
  // programmatic management necessary due to the implemented feature-set
  const baseFilterRef = useRef(null);
  const baseSelectRef = useRef(null);

  // merge with currencyData
  const [currencyNames, setCurrencyNames] = useState([]);
  const [convertFrom, setConvertFrom] = useState('USD');

  // employed in input field which is utilized as a filter for base currency
  const [baseFilterVal, setBaseFilterVal] = useState("");

  // a boolean always, should base select be in focus, check if this is needed
  const [baseSelectInFocus, setBaseSelectInFocus] = useState(false);

  // a boolean, currently a dependancy of a useEffect call which swaps focus into filter and from select if true, check if needed as useEffect, check
  // functionality doesn't break when additional filters and selects are added
  const [goToBaseFilter, setGoToBaseFilter] = useState(false);
 
  
  useEffect(fetchNames, []);
  useEffect(fetchRates, [], console.log('test fetch rates: ', currencyData));

  // clean this up, define functions for these, comb and weed unnecessary code
  useEffect(()=>baseSelectInFocus ? (()=>{baseSelectRef.current.focus();baseSelectRef.current.selectedIndex = 0})() : undefined, [baseSelectInFocus]);
  useEffect(()=>goToBaseFilter ? (()=>{baseFilterRef.current.focus();baseSelectRef.current.blur();baseSelectRef.current.selectedIndex = -1;setGoToBaseFilter(false);setBaseSelectInFocus(false)} )() : undefined,[goToBaseFilter])
  

  // APP METHODS are temporarily defined below the return block for development purposes

  return (
    // prevent default behavior of refresh of browser page when enter key is pressed in any/all input field
    <div className="Page" onKeyDown={(e)=>e.keyCode === 13 ? e.preventDefault() : undefined}>
      <header className="Header">
        <p>{convertFrom}</p>
      </header>
      <div className="Configure">
        <div className="Configure-Base-Left">
          <form>
          <input ref={baseFilterRef} onKeyUp={handleFilterDownArrow} placeholder="filter currency" onClick={handleBaseFilterClick} onChange={handleBaseFilterChange} value={baseFilterVal}/>
          </form>
          {
              <select size="5" ref={baseSelectRef} onKeyUp={handleSelectSpecialKeyPresses} onChange={handleBaseSelectChange} className="Configure-baseSelectBox">
               
                {// define named function for below filtering/mapping, rename variables
                currencyNames.filter(o=>o.toLowerCase().startsWith(baseFilterVal.toLowerCase()) ).map((o,i)=><option value={o} onClick={(e)=>handleOptionClick(o,e)}>{o}: {currencyData.fullNames[o]}</option>)
                }
                </select>
          }    
        </div>
        <div className="Configure-To-Right">
          <select className="To">
          </select>
        </div>
      </div>
      <main className="ChartContent"></main>
      <footer className="Footer">&copy; 2022 Joachim Byrnes-Shay</footer>
    </div>
  )


  // APP METHODS ARE BELOW
  // many INITIAL TWEAKS AND TODOS pending to include:
  // 1.  if filter doesn't yeield any results, 
  // up or down arrow should provide same functionality as clicking in filter field as if to edit, but currently does not
  // 2. up arrow back into filter field results in 2 positions-  first at end of string, second at start of string on an additionao 'up'-  probably normalize this so only one possibliity    

  function handleSelectSpecialKeyPresses(e) {
    // if up arrow pressed and at first index of list already, restore focus to filter field
    // this allows a smooth user experience of if using up arrow to scroll upward through select list, 
    // user "pops" into filter field after scrolling up past option 0
    if ((e.keyCode === 38) && (e.target.selectedIndex === 0)) {
      setGoToBaseFilter(true);
    } else if (e.key === 'Enter') {
      // when the enter key is pressed on an option, set the "currency to convert from" to the selected option  
      setConvertFrom(baseSelectRef.current.options[baseSelectRef.current.selectedIndex].value);
    }
  }
  function handleFilterDownArrow(e){
    // if down arrow pressed while in filter field, set focus to select box below it
    // part II of providing the user an up/down scrollable unit consisting of both filter field and select options list combined
    if (e.keyCode === 40) {
      console.log("key DOWN ARROW");
      setBaseSelectInFocus(true);
    }
  }
  
  function handleBaseFilterClick(e) {
    // if user uses mouse control to travel to and click into the filter field from any distance, instead of using up/down to scroll, 
    // reset focus of filter field to "true" and select box to "false" to induce working desired feature set in cooperation with the other tweaks 
    // since selectedIndex is manually set in cooperating functions, manually unset with -1 value here
    baseFilterRef.current.focus();
    baseSelectRef.current.selectedIndex=-1;
    setGoToBaseFilter(true);
  }

  function fetchRates() {
    let baseRates = `latest.json?app_id=${FetchConstants.app_id}&base='${currencyData.convertFrom}'`;
    fetch(FetchConstants.baseURL + baseRates).then(response => response.json())
      .then(data => currencyData.rates = data.rates)
  
  }
  
  function fetchNames() {
    let baseSubURLfullNames = 'currencies.json';
    fetch(FetchConstants.baseURL + baseSubURLfullNames).then(response => response.json())
      .then(data => currencyData.fullNames = data)
      .then(() => setCurrencyNames(Object.keys(currencyData.fullNames)));
  }
  
  function handleBaseFilterChange(thisFilter) {
    // the filter field input, used as new value in JSX upon changes
    let val = thisFilter.target.value;
    setBaseFilterVal(val);
  }
  
  function handleOptionClick(optionVal,e) {
    console.log(e.target.textContent);
    // if double-left click on an option, we want to use selection of this option to set a new convertFrom value (i.e. e.detail val is the consecutive num of left clicks)
    // design decision--- on double click, but NOT on single click, which potentially may be employed by user as part of the navigation process without other intentions
    if (e.detail === 2){
      setConvertFrom(optionVal);
    }
  }
  
  // not sure if we need to check onChange on select with the current implementation above, ok without using it so far in Firefox, check Chrome, Edge, etc browsers
  function handleBaseSelectChange(thisSelect){
    let val = thisSelect.target.value;
    console.log("select value is now changed to this: ", val);
  }
}


export default App;
