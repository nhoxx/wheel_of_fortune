import React, { Component, createRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Button,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Modal,
} from 'react-native';
import WheelOfFortune from './src/WheelsOfFortune';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import SplashScreen from 'react-native-splash-screen';
import CodePush from 'react-native-code-push';
import * as Progress from 'react-native-progress';

const participants = [
  '10K',
  '20K',
  '50k',
  '100k',
  '200k',
  '500K',
  '1000K'
];

const codePushOptions = {
  installMode: CodePush.InstallMode.IMMEDIATE,
  mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,
};
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      winnerValue: null,
      winnerIndex: null,
      started: false,
      codePushReceivedBytes: 0
    };
    this.child = null;
    this.confettiRef = createRef();
    this.total = 0;
  }

  componentDidMount() {
    setTimeout(() => {
      SplashScreen.hide();
    }, 1000);
    syncWithCodePush = (status) => {
      console.log('SplashScreen syncWithCodePush status = ' + status);
      switch (status) {
        case CodePush.SyncStatus.UP_TO_DATE:
        case CodePush.SyncStatus.UPDATE_INSTALLED:
        case CodePush.SyncStatus.UPDATE_IGNORED:
        case CodePush.SyncStatus.UNKNOWN_ERROR:
        case CodePush.SyncStatus.AWAITING_USER_ACTION:
          break;
        case CodePush.SyncStatus.SYNC_IN_PROGRESS:
        case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
        case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
        case CodePush.SyncStatus.INSTALLING_UPDATE:
          console.log('SplashScreen syncWithCodePush !bootstrapLoad');
          break;
      }
    };

    CodePush.sync(codePushOptions, syncWithCodePush, ({ receivedBytes, totalBytes }) => {
      this.total = totalBytes;
      this.setState({ codePushReceivedBytes: receivedBytes });
    });

  }



  buttonPress = () => {
    this.setState({
      started: true,
    });
    this.child._onPress();
  };

  triggerConfetti = () => {
    this.confettiRef?.current?.play(2);
  }

  render() {
    const wheelOptions = {
      rewards: participants,
      knobSize: 30,
      borderWidth: 5,
      borderColor: '#fff',
      innerRadius: 30,
      backgroundColor: 'transparent',
      textAngle: 'horizontal',
      onRef: ref => (this.child = ref),
    };
    return (
      <View style={styles.container}>
        <StatusBar barStyle={'light-content'} translucent backgroundColor={'transparent'} />
        <ImageBackground
          source={require('./src/assets/background.jpg')}
          resizeMode={'cover'}
          style={{
            width: Dimensions.get('screen').width,
            height: Dimensions.get('screen').height,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View style={{
            flex: 1,
            marginTop: -100,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <WheelOfFortune
              options={wheelOptions}
              getWinner={(value, index) => {
                this.setState({ winnerValue: value, winnerIndex: index });
              }}
            />
            {!this.state.started && (
              <View style={styles.startButtonView}>
                <TouchableOpacity
                  onPress={() => this.buttonPress()}
                  style={styles.startButton}>
                  <Text style={styles.startButtonText}>{'Quay nào!'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Modal
            transparent
            animationType={'fade'}
            visible={this.state.winnerIndex != null}
          >
            <View style={{
              justifyContent: 'center',
              flex: 1,
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)'
            }}>
              <View style={styles.winnerView}>
                <Text style={styles.winnerText}>
                  Lụm bao lì xì  {participants[this.state.winnerIndex]}
                </Text>
                <LinearGradient
                  colors={['#e04602', '#ffbc30']}
                  style={styles.tryAgainButton}
                >
                  <TouchableOpacity
                    onPress={() => {
                      this.setState({ winnerIndex: null });
                      this.child._tryAgain();
                    }}
                  >
                    <Text style={styles.tryAgainText}>{'Quay nào!'}</Text>
                  </TouchableOpacity>
                </LinearGradient>
                <View style={{ height: 70 }} />
              </View>
              <LottieView
                ref={this.confettiRef}
                source={require('./src/assets/confetti.json')}
                autoPlay={true}
                loop={true}
                style={styles.lottie}
                resizeMode='cover'
              />
            </View>
          </Modal>
          {this.total != 0 && <Progress.Bar
            style={{
              bottom: 50,
              position: 'absolute'
            }}
            progress={this.state.codePushReceivedBytes / this.total}
            color={'white'}
            showsText
            width={Dimensions.get('window').width - 40}
          />
          }
        </ImageBackground>
      </View>

    );
  }
}
export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonView: {
    position: 'absolute',
  },
  startButton: {
    backgroundColor: 'rgba(0,0,0,.5)',
    marginTop: 50,
    paddingVertical: 5,
    borderRadius: 10,
    paddingHorizontal: 10
  },
  startButtonText: {
    fontSize: 50,
    color: '#fff',
    fontWeight: 'bold',
  },
  winnerView: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    position: 'absolute'
  },
  tryAgainButton: {
    padding: 10,
    borderRadius: 10,
  },
  winnerText: {
    fontSize: 30,
    color: 'white',
    textShadowColor: 'red',
    fontWeight: 'bold',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 20,
  },
  tryAgainButton: {
    paddingVertical: 7,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginTop: 7
  },
  tryAgainText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  lottie: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});