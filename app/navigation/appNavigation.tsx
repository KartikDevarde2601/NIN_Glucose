import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createMaterialBottomTabNavigator} from 'react-native-paper/react-navigation';
import HomeScreen from '../screens/homeScreen';
import LoginScreen from '../screens/loginScreen';
import ProfileScreen from '../screens/profileScreen';
import NewPatientScreen from '../screens/newPatientScreen';
import PatientDetailScreen from '../screens/patientDetailScreen';
import AddClinicalDataScreen from '../screens/addClinicalDataScreen';
import {load} from '../utils/storage';
import {useStores} from '../models';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {observer} from 'mobx-react-lite';
import {
  faHouse,
  faUserPlus,
  faUserDoctor,
} from '@fortawesome/free-solid-svg-icons';

export type RootStackParamList = {
  hometabs: undefined;
  patientDetail: {patientId: string};
  addClinicalData: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type TabParamList = {
  home: undefined;
  addpatient: undefined;
  profile: undefined;
};

type StylesType = {
  container: ViewStyle;
  logo: ImageStyle;
};

// Create typed navigators
const Tab = createMaterialBottomTabNavigator<TabParamList>();
const MainStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const HomeTab: React.FC = () => (
  <Tab.Navigator
    activeColor="rgb(120, 69, 172)"
    barStyle={{backgroundColor: 'rgb(255, 251, 255)'}}>
    <Tab.Screen
      name="home"
      component={HomeScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({color}: {color: string}) => (
          <FontAwesomeIcon icon={faHouse} color={color} size={24} />
        ),
      }}
    />
    <Tab.Screen
      name="addpatient"
      component={NewPatientScreen}
      options={{
        tabBarLabel: 'AddPatient',
        tabBarIcon: ({color}: {color: string}) => (
          <FontAwesomeIcon icon={faUserPlus} color={color} size={24} />
        ),
      }}
    />
    <Tab.Screen
      name="profile"
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({color}: {color: string}) => (
          <FontAwesomeIcon icon={faUserDoctor} color={color} size={24} />
        ),
      }}
    />
  </Tab.Navigator>
);

const MainNavigator: React.FC = () => (
  <MainStack.Navigator initialRouteName="hometabs">
    <MainStack.Screen
      name="hometabs"
      component={HomeTab}
      options={{headerShown: false}}
    />
    <MainStack.Screen
      name="patientDetail"
      component={PatientDetailScreen}
      options={{headerShown: true}}
    />
    <MainStack.Screen
      name="addClinicalData"
      component={AddClinicalDataScreen}
      options={{headerShown: false}}
    />
  </MainStack.Navigator>
);

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator>
    <AuthStack.Screen
      name="Login"
      component={LoginScreen}
      options={{headerShown: false}}
    />
  </AuthStack.Navigator>
);

const AppNavigator: React.FC = observer(() => {
  const {
    authenticationStore: {isAuthenticated},
  } = useStores();

  return (
    <NavigationContainer>
      <MainNavigator />
      {/* {isAuthenticated ? <MainNavigator /> : <AuthNavigator />} */}
    </NavigationContainer>
  );
});

export default AppNavigator;

const styles = StyleSheet.create<StylesType>({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    // Add your logo styles here
  },
});
