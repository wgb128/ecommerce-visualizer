import React, { Component } from 'react';
import './App.css';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import PieChart from 'react-svg-piechart';

import 'react-select/dist/react-select.css';
var Select = require('react-select');

class Product extends Component {
  constructor() {
    super();
    this.state = {
      colorchartdata: [],
      branddata: []
    };
  }
  dbLoad = () => {
    var chart_color_list = ['#3366CC','#DC3912','#FF9900','#109618','#990099',
                            '#3B3EAC','#0099C6','#DD4477','#66AA00','#B82E2E',
                            '#316395','#994499','#22AA99','#AAAA11','#6633CC',
                            '#E67300','#8B0707','#329262','#5574A6','#3B3EAC'];
    function createColorChartData(counts) {
      return Object.keys(counts).map((color, _index, _arr) => {
        return {
          label: color,
          value: counts[color],
          color: (color === 'other') ? '#808080' : color
        }
      }).sort((a, b) => (a.value > b.value) ? -1 : 1);
    }
    function createBrandData(counts) {
      return Object.keys(counts).map((brand, index, _arr) => {
        return {
          label: brand,
          value: counts[brand],
          color: chart_color_list[index % 20]
        }
      }).sort((a, b) => (a.value > b.value) ? -1 : 1);
    }
    var category = this.props.value;
    function processResponseJSON(response) {
      this.setState({
        colorchartdata: createColorChartData(response.analysis.color_counts),
        branddata: createBrandData(response.analysis.brand_counts)
      });
    }
    fetch('http://localhost:3001/?category='+category, {mode: 'cors'})
      .then(response => response.json().then(processResponseJSON.bind(this)));
  }
  render() {
    return (
      <div className="Product">
        <button className="product" onClick={this.dbLoad}>Load</button>
        <Tabs>
          <TabList>
            <Tab>Colors</Tab>
            <Tab>Brands</Tab>
          </TabList>
          <TabPanel>
            <div className="PieChart">
              <div className="pie">
                <PieChart data={this.state.colorchartdata} />
              </div>
              <div className="legend">
                {
                  this.state.colorchartdata.map((element, i) => (
                    <div key={i}>
                      <div style={{background: element.color}} className="circle"></div>
                        <span>
                          {element.label} : {element.value}
                        </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="PieChart">
              <div className="pie">
                <PieChart data={this.state.branddata} />
              </div>
              <div className="legend">
                {
                  this.state.branddata.map((element, i) => (
                    <div key={i}>
                      <div style={{background: element.color}} className="circle"></div>
                        <span>
                          {element.label} : {element.value}
                        </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    )
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      current_keyword: 'apron'
    }
    this.dropdown_options = [
        'apron', 'bandanna', 'bathing suit', 'belt', 'bikini', 'boot',
        'bow tie', 'bra', 'bracelet', 'cardigan', 'coat', 'dress', 'earmuffs',
        'earrings', 'fedora', 'flip-flops', 'glasses', 'gloves', 'handbag',
        'hat', 'helmet', 'high heels', 'jacket', 'jeans', 'kimono', 'mittens',
        'necklace', 'overalls', 'pajamas', 'parka', 'pea coat', 'raincoat',
        'sandals', 'scarf', 'shirt', 'shoe', 'shorts', 'skirt', 'sneakers',
        'sock', 'sunglasses', 'sweater', 't-shirt', 'tie', 'tights',
        'turtleneck', 'tuxedo', 'vest', 'wig', 'windbreaker'
    ].map(val => {return {value: val, label: val}});
  }
  onDropdownChange = (val) => {
    this.setState({current_keyword: val.value});
  }
  render() {
    return (
      <div className="App">
        <Select
          name='category-dropdown'
          value={this.state.current_keyword}
          options={this.dropdown_options}
          onChange={this.onDropdownChange}
        />
        <Product value={this.state.current_keyword}/>
      </div>
    );
  }
}

export default App;
