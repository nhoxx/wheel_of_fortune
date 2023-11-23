import React, { Component } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Animated,
    TouchableOpacity,
    Image,
    ImageBackground,
    Text as TextA
} from 'react-native';
import * as d3Shape from 'd3-shape';

import Svg, { G, Text, TSpan, Path, Pattern, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import dings from './assets/ding.mp3';
import confettis from './assets/confetti.mp3';

var Sound = require('react-native-sound');
Sound.setCategory('Playback');

var ding = new Sound(dings);
var confetti = new Sound(confettis);
const EMOJI = ['😭', '😩', '🤭', '😌', '😊', '😝', '🤑']
const percent = [0.2, 0.55, 0.2, 0.04, 0.01, 0, 0];
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const { width, height } = Dimensions.get('screen');

class WheelOfFortune extends Component {
    constructor(props) {
        super(props);
        this.state = {
            enabled: false,
            started: false,
            finished: false,
            winner: null,
            gameScreen: new Animated.Value(width - 40),
            wheelOpacity: new Animated.Value(1),
            imageLeft: new Animated.Value(width / 2 - 30),
            imageTop: new Animated.Value(height / 2 - 70),
        };
        this.angle = 0;
        this.deg = 0;
        this.prepareWheel();
    }

    prepareWheel = () => {
        this.Rewards = this.props.options.rewards;
        this.RewardCount = this.Rewards.length;
        this.deg = 0;
        this.numberOfSegments = this.RewardCount;
        this.fontSize = 20;
        this.oneTurn = 360;
        this.angleBySegment = this.oneTurn / this.numberOfSegments;
        this.angleOffset = this.angleBySegment / 2;
        this.winner = this.props.options.winner ?? Math.floor(Math.random() * this.numberOfSegments);
        this._wheelPaths = this.makeWheel();
        this._angle = new Animated.Value(0);

        this.props.options.onRef(this);
    };

    resetWheelState = () => {
        this.setState({
            enabled: false,
            started: false,
            finished: false,
            winner: null,
            gameScreen: new Animated.Value(width - 40),
            wheelOpacity: new Animated.Value(1),
            imageLeft: new Animated.Value(width / 2 - 30),
            imageTop: new Animated.Value(height / 2 - 70),
        });
    };

    _tryAgain = () => {
        this.prepareWheel();
        this.resetWheelState();
        this.angleListener();
        this._onPress();
    };

    angleListener = () => {
        this._angle.addListener(event => {
            if (this.state.enabled) {
                this.setState({
                    enabled: false,
                    finished: false,
                });
            }
            this.angle = event.value;
        });
    };

    componentWillUnmount() {
        this.props.options.onRef(undefined);
    }

    componentDidMount() {
        this.angleListener();
        ding.setVolume(1);
        confetti.setVolume(1);
    }

    makeWheel = () => {
        const data = Array.from({ length: this.numberOfSegments }).fill(1);
        const arcs = d3Shape.pie()(data);
        var colors = this.props.options.colors
            ? this.props.options.colors
            : [
                '#E07026',
                '#E8C22E',
                '#ABC937',
                '#4F991D',
                '#22AFD3',
                '#5858D0',
                '#7B48C8',
                '#D843B9',
                '#E23B80',
                '#D82B2B',
            ];
        return arcs.map((arc, index) => {
            const instance = d3Shape
                .arc()
                .padAngle(0.01)
                .outerRadius(width / 2)
                .innerRadius(this.props.options.innerRadius || 100);
            return {
                path: instance(arc),
                color: colors[index % colors.length],
                value: this.Rewards[index],
                centroid: instance.centroid(arc),
            };
        });
    };

    _getWinnerIndex = (value) => {
        const deg = Math.abs(Math.round(value % this.oneTurn));
        // wheel turning counterclockwise
        if (value < 0) {
            return Math.floor(deg / this.angleBySegment);
        }
        // wheel turning clockwise
        return (
            (this.numberOfSegments - Math.floor(deg / this.angleBySegment)) %
            this.numberOfSegments
        );
    };

    _handleResult = () => {
        let weightedList = [];
        for (let i = 0; i < percent.length; i++) {
            for (let j = 0; j < percent[i] * 100; j++) {
                weightedList.push(i);
            }
        }
        weightedList.sort(function () {
            return Math.random() - 0.5
        });
        // Get a random index from the weightedList and use it to get the price
        const winningPriceIndex = weightedList[Math.floor(Math.random() * weightedList.length)];
        const result = this.Rewards[winningPriceIndex];
        return winningPriceIndex;
    }

    _onPress = () => {
        ding.play();
        confetti.stop();
        try {
            const duration = this.props.options.duration || 10000;
            const winnerIndex = this._handleResult();
            const toValue = (360 * (duration / 1000) - Math.abs(Math.round(((this.angleBySegment * winnerIndex)))));
            this.setState({
                started: true,
            });
            Animated.timing(this._angle, {
                toValue: toValue,
                duration: duration,
                useNativeDriver: true,
            }).start(() => {
                ding.stop();
                confetti.play();
                this.setState({
                    finished: true,
                    winner: this._wheelPaths[winnerIndex].value,
                });
                if (this.props.getWinner) {
                    this.props.getWinner(this._wheelPaths[winnerIndex].value, winnerIndex);
                } else {
                    this.props.options?.getWinner?.(
                        this._wheelPaths[winnerIndex].value,
                        winnerIndex
                    );
                }
            });
        } catch (error) {
            console.log('error', error)
        }
    };

    _textRender = (x, y, number, i) => (
        <Text
            x={x - number.length * 5}
            y={y - 80}
            fill={
                this.props.options.textColor ? this.props.options.textColor : '#fff'
            }
            textAnchor="middle"
            fontSize={this.fontSize}>
            {Array.from({ length: number.length }).map((_, j) => {
                // Render reward text vertically
                if (this.props.options.textAngle === 'vertical') {
                    return (
                        <TSpan x={x} dy={this.fontSize} key={`arc-${i}-slice-${j}`}>
                            {number.charAt(j)}
                        </TSpan>
                    );
                }
                // Render reward text horizontally
                else {
                    return (
                        <TSpan
                            y={y - 40}
                            dx={this.fontSize * 0.07}
                            key={`arc-${i}-slice-${j}`}>
                            {number.charAt(j)}
                        </TSpan>
                    );
                }
            })}
        </Text>
    );

    _renderSvgWheel = () => {
        return (
            <View style={styles.container}>
                {this._renderKnob()}
                <ImageBackground
                    source={require('./assets/border.png')}
                    style={{
                        width: width,
                        height: width,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                    resizeMode={'stretch'}
                >
                    <Animated.View
                        style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: [
                                {
                                    rotate: this._angle.interpolate({
                                        inputRange: [-this.oneTurn, 0, this.oneTurn],
                                        outputRange: [
                                            `-${this.oneTurn}deg`,
                                            `0deg`,
                                            `${this.oneTurn}deg`,
                                        ],
                                    }),
                                },
                            ],
                            backgroundColor: this.props.options.backgroundColor
                                ? this.props.options.backgroundColor
                                : '#fff',
                            width: width - 20,
                            height: width - 20,
                            borderRadius: (width - 20) / 2,
                            // borderWidth: this.props.options.borderWidth
                            //     ? this.props.options.borderWidth
                            //     : 2,
                            // borderColor: this.props.options.borderColor
                            //     ? this.props.options.borderColor
                            //     : '#fff',
                            opacity: this.state.wheelOpacity,
                        }}>
                        <AnimatedSvg
                            width={this.state.gameScreen}
                            height={this.state.gameScreen}
                            viewBox={`0 0 ${width} ${width}`}
                            style={{
                                transform: [{ rotate: `-${this.angleOffset}deg` }],
                                margin: 10,
                            }}>
                            <G y={width / 2} x={width / 2}>
                                {this._wheelPaths.map((arc, i) => {
                                    const [x, y] = arc.centroid;
                                    const number = arc.value.toString();
                                    return (
                                        <G key={`arc-${i}`}>
                                            <LinearGradient id={`grad`} x1="0%" y1="0%" x2="0%" y2="100%">
                                                <Stop offset="0" stopColor={'#e04602'} />
                                                <Stop offset="1" stopColor={'#ffbc30'} />
                                                <Stop offset="2" stopColor={'#f0ca44'} />
                                            </LinearGradient>
                                            <Path d={arc.path} strokeWidth={2} fill={`url(#grad)`} />
                                            <G
                                                rotation={
                                                    (i * this.oneTurn) / this.numberOfSegments +
                                                    this.angleOffset
                                                }
                                                origin={`${x}, ${y}`}>
                                                {this._textRender(x, y, number, i)}
                                                <TSpan
                                                    x={x - number.length * 5}
                                                    y={y + 40}
                                                    fontSize={this.fontSize * 1.2}
                                                    dx={this.fontSize * 0.07}
                                                >
                                                    {EMOJI[i]}
                                                </TSpan>
                                            </G>

                                        </G>
                                    );
                                })}
                            </G>
                        </AnimatedSvg>
                    </Animated.View>
                </ImageBackground>
            </View>
        );
    };

    _renderKnob = () => {
        const knobSize = this.props.options.knobSize
            ? this.props.options.knobSize
            : 20;
        // [0, this.numberOfSegments]
        const YOLO = Animated.modulo(
            Animated.divide(
                Animated.modulo(
                    Animated.subtract(this._angle, this.angleOffset),
                    this.oneTurn,
                ),
                new Animated.Value(this.angleBySegment),
            ),
            1,
        );

        return (
            <Animated.View
                style={{
                    width: knobSize,
                    height: knobSize * 2,
                    justifyContent: 'flex-end',
                    zIndex: 1,
                    opacity: this.state.wheelOpacity,
                    transform: [
                        {
                            rotate: YOLO.interpolate({
                                inputRange: [-1, -0.5, -0.0001, 0.0001, 0.5, 1],
                                outputRange: [
                                    '0deg',
                                    '0deg',
                                    '35deg',
                                    '-35deg',
                                    '0deg',
                                    '0deg',
                                ],
                            }),
                        },
                    ],
                }}>
                <Svg
                    width={knobSize}
                    height={(knobSize * 100) / 57}
                    viewBox={`0 0 57 100`}
                    style={{
                        transform: [{ translateY: 8 }],
                    }}>
                    <Image
                        source={
                            this.props.options.knobSource
                                ? this.props.options.knobSource
                                : require('./assets/knob.png')
                        }
                        style={{ width: knobSize, height: (knobSize * 100) / 57 }}
                    />
                </Svg>
            </Animated.View>
        );
    };

    _renderTopToPlay() {
        if (this.state.started == false) {
            return (
                <TouchableOpacity onPress={() => this._onPress()}>
                    {this.props.options.playButton()}
                </TouchableOpacity>
            );
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <View
                    style={{
                        position: 'absolute',
                        width: width,
                        height: height / 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <Animated.View style={[styles.content, { padding: 10 }]}>
                        {this._renderSvgWheel()}
                    </Animated.View>
                </View>
                {this.props.options.playButton ? this._renderTopToPlay() : null}
            </View>
        );
    }
}

export default WheelOfFortune;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {},
    startText: {
        fontSize: 50,
        color: '#fff',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
});