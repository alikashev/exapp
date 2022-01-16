import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
// Create the client-side database if necessary and a handle/connection to the database, an object.
const db = SQLite.openDatabase("db.testDb");

/**
 * Entry point for display to mobile
 */
 class App extends React.Component {

    /**
   *
   */
     componentDidMount() {
      this.getLocationAsync();
    }

      /**
   *
   */
  getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== "granted") {
      this.setState({
        errorMessage: "Permission to access location was denied",
      });
    }

    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    const { latitude, longitude } = location.coords;
    this.getGeocodeAsync({ latitude, longitude });
    this.setState({ location: { latitude, longitude } });
  };

     /**
   *
   * @param {mixed} location
   */
      getGeocodeAsync = async (location) => {
        let geocode = await Location.reverseGeocodeAsync(location);
        this.setState({ geocode });
      };

   /**
   * Read method uses arrow-function syntax
   */
    fetchData = () => {
      db.transaction((tx) => {
        // Syntax: tx.executeSql(sqlStatement, arguments, success, error)
        // sending 4 arguments in executeSql
        tx.executeSql(
          "SELECT * FROM items",
          null, // passing sql query and parameters:null
          // success callback which sends two things Transaction object and ResultSet Object
          (txObj, { rows: { _array } }) => this.setState({ data: _array }),
          // failure callback which sends two things Transaction object and Error
          (txObj, error) => console.log("Error ", error)
        ); // end executeSQL
      }); // end transaction
    };

      /**
   * Create method an event handler for new item creation
   */
       newItem = () => {
        db.transaction((tx) => {
          let city = this.state.geocode[0].city;
          let street = this.state.geocode[0].street;
          // The executeSql() method has an argument intended to allow variables to be substituted into statements without risking SQL injection vulnerabilities.
          // Always use "?" placeholders, pass the variables in as the second argument:
          tx.executeSql(
            "INSERT INTO items (text, count) values (?, ?)",
            [street, 0],
            (txObj, resultSet) =>
              this.setState({
                data: this.state.data.concat({
                  id: resultSet.insertId,
                  text: city,
                  count: 0,
                }),
              }),
            (txObj, error) => console.log("Error", error)
          );
        });
      };
   /**
   * Update method an event handler for item changes
   * @param {int} id
   */
    increment = (id) => {
      db.transaction((tx) => {
        tx.executeSql(
          "UPDATE items SET count = count + 1 WHERE id = ?",
          [id],
          (txObj, resultSet) => {
            if (resultSet.rowsAffected > 0) {
              let newList = this.state.data.map((data) => {
                if (data.id === id) return { ...data, count: data.count + 1 };
                else return data;
              });
              this.setState({ data: newList });
            }
          }
        );
      });
    };

    /**
   * Delete method an event handler for item removal
   * @param {int} id
   */
     delete = (id) => {
      db.transaction((tx) => {
        tx.executeSql(
          "DELETE FROM items WHERE id = ? ",
          [id],
          (txObj, resultSet) => {
            if (resultSet.rowsAffected > 0) {
              let newList = this.state.data.filter((data) => {
                if (data.id === id) return false;
                else return true;
              });
              this.setState({ data: newList });
            }
          }
        );
      });
    };

  /**
   * Constructor
   * @param {mixed} props
   */
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      location: null,
      geocode: null,
      errorMessage: "",
    };

    // Check if the items table exists if not create it
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, count INT)"
      );
    });
    // Call fetchData method die nog niet bestaat
    this.fetchData();
  }
  
  /**
   * Required render, called when state is altered
   */
  render() {
    const { location, geocode, errorMessage } = this.state;
    return (
      <View style={Style.main}>
        <Text style={Style.heading}>Add Random Name with Counts</Text>
        <TouchableOpacity onPress={this.newItem} style={Style.green}>
          <Text style={Style.white}>Add New Item</Text>
        </TouchableOpacity>
        <Text style={Style.heading}>
          {geocode ? geocode[0].street : ""}
          {" te "}
          {geocode ? `${geocode[0].city}, ${geocode[0].isoCountryCode}` : ""}
        </Text>
        <Text style={Style.heading}>
          {location ? `${location.latitude}, ${location.longitude}` : ""}
        </Text>
        <ScrollView style={Style.widthfull}>
          {this.state.data &&
            this.state.data.map((data) => (
              <View key={data.id} style={Style.list}>
                <Text style={Style.badge}>{data.count}</Text>
                <Text>{data.text}</Text>

                <TouchableOpacity onPress={() => this.increment(data.id)}>
                  <Text style={Style.boldGreen}> + </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.delete(data.id)}>
                  <Text style={Style.boldRed}> DEL </Text>
                </TouchableOpacity>
              </View>
            ))}
        </ScrollView>
      </View>
    );
  }
}

export default App;

/**
 * Style prop
 */
const Style = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#95a5a6",
  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "#4630eb",
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 4,
  },
  list: {
    backgroundColor: "#bdc3c7",
    flex: 1,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 64,
    margin: 8,
    color: "#006266",
  },
  main: {
    backgroundColor: "#ecf0f1",
    marginTop: 32,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
  },
  green: {
    borderRadius: 48,
    backgroundColor: "#2980b9",
  },
  white: {
    padding: 4,
    textAlign: "center",
    fontSize: 32,
    fontWeight: "bold",
    color: "#bdc3c7",
  },
  boldGreen: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#8e44ad",
  },
  boldRed: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9b59b6",
  },
  badge: {
    backgroundColor: "#34495e",
    color: "#ecf0f1",
    fontWeight: "bold",
    fontSize: 16,
    borderRadius: 48,
    minWidth: 30,
    padding: 4,
    textAlign: "center",
  },
});
