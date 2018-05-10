const React = require('react');
import { PixelRatio } from 'react-native';
const { ViewPropTypes } = ReactNative = require('react-native');
const PropTypes = require('prop-types');
const createReactClass = require('create-react-class');
const {
    View,
    Animated,
    StyleSheet,
    ScrollView,
    Text,
    Platform,
    Dimensions,
    TouchableOpacity,
    Image,
} = ReactNative;
const Button = require('./TopBar/Button');

const WINDOW_WIDTH = Dimensions
    .get('window')
    .width;

import platform from '../common/platform'
import value from './value';

const ScrollableTabBar = createReactClass({
    propTypes: {
        goToPage: PropTypes.func,
        activeTab: PropTypes.number,
        tabs: PropTypes.array,
        backgroundColor: PropTypes.string,
        activeTextColor: PropTypes.string,
        inactiveTextColor: PropTypes.string,
        scrollOffset: PropTypes.number,
        style: ViewPropTypes.style,
        tabStyle: ViewPropTypes.style,
        tabsContainerStyle: ViewPropTypes.style,
        textStyle: Text.propTypes.style,
        renderTab: PropTypes.func,
        underlineStyle: ViewPropTypes.style,
        onScroll: PropTypes.func
    },

    getDefaultProps() {
        return {
            scrollOffset: 0,
            activeTextColor: 'navy',
            inactiveTextColor: 'black',
            backgroundColor: null,
            style: {},
            tabStyle: {},
            tabsContainerStyle: {},
            underlineStyle: {}
        };
    },

    getInitialState() {
        this._tabsMeasurements = [];
        return {
            _leftTabUnderline: new Animated.Value(5),
            _widthTabUnderline: new Animated.Value(42),
            _containerWidth: null
        };
    },

    componentDidMount() {
        this
            .props
            .scrollValue
            .addListener(this.updateView);
    },

    updateView(offset) {
        const position = Math.floor(offset.value);
        const pageOffset = offset.value % 1;
        const tabCount = this.props.tabs.length;
        const lastTabPosition = tabCount - 1;

        if (tabCount === 0 || offset.value < 0 || offset.value > lastTabPosition) {
            return;
        }

        if (this.necessarilyMeasurementsCompleted(position, position === lastTabPosition)) {
            this.updateTabPanel(position, pageOffset);
            this.updateTabUnderline(position, pageOffset, tabCount);
        }
    },

    necessarilyMeasurementsCompleted(position, isLastTab) {
        return this._tabsMeasurements[position] && (isLastTab || this._tabsMeasurements[position + 1]) && this._tabContainerMeasurements && this._containerMeasurements;
    },

    updateTabPanel(position, pageOffset) {
        const containerWidth = this._containerMeasurements.width - platform.toolbarHeight;
        const tabWidth = this._tabsMeasurements[position].width;
        const nextTabMeasurements = this._tabsMeasurements[position + 1];
        const nextTabWidth = nextTabMeasurements && nextTabMeasurements.width || 0;
        const tabOffset = this._tabsMeasurements[position].left;
        const absolutePageOffset = pageOffset * tabWidth;
        let newScrollX = tabOffset + absolutePageOffset;
        // center tab and smooth tab change (for when tabWidth changes a lot between two
        // tabs)
        newScrollX -= (containerWidth - (1 - pageOffset) * tabWidth - pageOffset * nextTabWidth) / 2;
        newScrollX = newScrollX >= 0
            ? newScrollX
            : 0;

        if (Platform.OS === 'android') {
            this
                ._scrollView
                .scrollTo({ x: newScrollX, y: 0, animated: false });
        } else {
            const rightBoundScroll = this._tabContainerMeasurements.width - (this._containerMeasurements.width);
            newScrollX = newScrollX > rightBoundScroll
                ? rightBoundScroll
                : newScrollX;
            this
                ._scrollView
                .scrollTo({ x: newScrollX, y: 0, animated: false });
        }

    },

    updateTabUnderline(position, pageOffset, tabCount) {
        const lineLeft = this._tabsMeasurements[position].left;
        const lineRight = this._tabsMeasurements[position].right;

        if (position < tabCount - 1) {
            const nextTabLeft = this._tabsMeasurements[position + 1].left;
            const nextTabRight = this._tabsMeasurements[position + 1].right;
            const newLineLeft = (pageOffset * nextTabLeft + (1 - pageOffset) * lineLeft);
            const newLineRight = (pageOffset * nextTabRight + (1 - pageOffset) * lineRight);
            this
                .state
                ._leftTabUnderline
                .setValue(newLineLeft + 5);
            this
                .state
                ._widthTabUnderline
                .setValue(newLineRight - newLineLeft - 10);
        } else {
            this
                .state
                ._leftTabUnderline
                .setValue(lineLeft + 5);
            this
                .state
                ._widthTabUnderline
                .setValue(lineRight - lineLeft - 10);
        }
    },

    renderTab(name, page, isTabActive, onPressHandler, onLayoutHandler) {
        const { activeTextColor, inactiveTextColor, textStyle } = this.props;
        const textColor = isTabActive
            ? activeTextColor
            : inactiveTextColor;
        const fontWeight = isTabActive
            ? 'bold'
            : 'normal';
        const fontSizeT = value.top_class_font_size

        return <Button
            key={`${name}_${page}`}
            accessible={true}
            accessibilityLabel={name}
            accessibilityTraits='button'
            onPress={() => onPressHandler(page)}
            onLayout={onLayoutHandler}>
            <View style={[styles.tab, this.props.tabStyle, {
                //marginRight: page == this.props.tabs.length-1?9:0,
                //marginLeft: page == 0?9:0,
            }]}>
                <Text
                    style={[
                        {
                            color: textColor,
                            fontWeight,
                            fontSize: fontSizeT
                        },
                        textStyle
                    ]}>
                    {name}
                </Text>
            </View>
        </Button>;
    },

    measureTab(page, event) {
        const { x, width, height } = event.nativeEvent.layout;
        this._tabsMeasurements[page] = {
            left: x,
            right: x + width,
            width,
            height
        };
        this.updateView({ value: this.props.scrollValue._value });
    },

    render() {
        const tabUnderlineStyle = {
            position: 'absolute',
            height: 4,
            backgroundColor: 'navy',
            bottom: 0
        };

        const dynamicTabUnderline = {
            left: this.state._leftTabUnderline,
            width: this.state._widthTabUnderline
        };

        return <View
            style={[
                styles.container, {
                    backgroundColor: this.props.backgroundColor
                },
                this.props.style
            ]}
            onLayout={this.onContainerLayout}>
            <ScrollView
                ref={(scrollView) => {
                    this._scrollView = scrollView;
                }}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                directionalLockEnabled={true}
                bounces={true}
                scrollsToTop={false}
                //style={{ width: platform.deviceWidth - platform.toolbarHeight }}
            >
                <View
                    style={[
                        styles.tabs, {
                            width: this.state._containerWidth
                        },
                        this.props.tabsContainerStyle
                    ]}
                    ref={'tabContainer'}
                    onLayout={this.onTabContainerLayout}>
                    <Animated.View
                        style={[tabUnderlineStyle, dynamicTabUnderline, this.props.underlineStyle]} />
                    {this
                        .props
                        .tabs
                        .map((name, page) => {
                            const isTabActive = this.props.activeTab === page;
                            const renderTab = this.props.renderTab || this.renderTab;
                            return renderTab(name, page, isTabActive, this.props.goToPage, this.measureTab.bind(this, page));
                        })}

                </View>
            </ScrollView>
            {/*<TouchableOpacity
                onPress={this.props.moreClick}
                style={{
                    height: platform.toolbarHeight,
                    width: platform.toolbarHeight * 1.6,
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                <Image style={{
                    height: 20,
                    width: 32
                }} resizeMode="stretch" source={require('../img/ic_header_more.png')} />
            </TouchableOpacity>*/}
        </View>;
    },

    componentWillReceiveProps(nextProps) {
        // If the tabs change, force the width of the tabs container to be recalculated
        if (JSON.stringify(this.props.tabs) !== JSON.stringify(nextProps.tabs) && this.state._containerWidth) {
            this.setState({ _containerWidth: null });
        }
    },

    onTabContainerLayout(e) {
        this._tabContainerMeasurements = e.nativeEvent.layout;
        let width = this._tabContainerMeasurements.width;
        if (width < WINDOW_WIDTH) {
            width = WINDOW_WIDTH;
        }
        this.setState({ _containerWidth: width });
        this.updateView({ value: this.props.scrollValue._value });
    },

    onContainerLayout(e) {
        this._containerMeasurements = e.nativeEvent.layout;
        this.updateView({ value: this.props.scrollValue._value });
    }
});

module.exports = ScrollableTabBar;

const styles = StyleSheet.create({
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 9,
        paddingRight: 9,
        height: platform.toolbarHeight
    },
    container: {
        borderWidth: 1 / PixelRatio.get(),
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderColor: '#dcdcdc',
        paddingTop: platform.headerPaddingTop,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    }
});