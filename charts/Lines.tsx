import * as React from "react"
import { map, flatten, some, includes, sortBy, filter, sum, guid } from "./Util"
import { computed, action, observable } from "mobx"
import { observer } from "mobx-react"
import { LineChartSeries, LineChartValue } from "./LineChart"
import { AxisScale } from "./AxisScale"
import { Vector2 } from "./Vector2"
import { getRelativeMouse, makeSafeForCSS, pointsToPath } from "./Util"
import { Bounds } from "./Bounds"
import { EntityDimensionKey } from "./EntityDimensionKey"
import { AxisBox } from "./AxisBox"

export interface LinesProps {
    axisBox: AxisBox
    xScale: AxisScale
    yScale: AxisScale
    data: LineChartSeries[]
    focusKeys: EntityDimensionKey[]
    onHover: (hoverX: number | undefined) => void
}

interface LineRenderSeries {
    entityDimensionKey: EntityDimensionKey
    displayKey: string
    color: string
    values: Vector2[]
    isFocus: boolean
    isProjection?: boolean
}

export interface HoverTarget {
    pos: Vector2
    series: LineChartSeries
    value: LineChartValue
}

// Metadata reflection hack - Mispy
declare const global: any
if (typeof global !== "undefined") {
    global.MouseEvent = {}
}

@observer
export class Lines extends React.Component<LinesProps> {
    base: React.RefObject<SVGGElement> = React.createRef()
    @observable.ref hover: HoverTarget | null = null

    @computed get renderUid(): number {
        return guid()
    }

    @computed get renderData(): LineRenderSeries[] {
        const { data, xScale, yScale, focusKeys } = this.props
        return map(data, series => {
            return {
                entityDimensionKey: series.entityDimensionKey,
                displayKey: `key-${makeSafeForCSS(series.entityDimensionKey)}`,
                color: series.color,
                values: series.values.map(v => {
                    return new Vector2(
                        Math.round(xScale.place(v.x)),
                        Math.round(yScale.place(v.y))
                    )
                }),
                isFocus:
                    !focusKeys.length ||
                    includes(focusKeys, series.entityDimensionKey),
                isProjection: series.isProjection
            }
        })
    }

    @computed get isFocusMode(): boolean {
        return some(this.renderData, d => d.isFocus)
    }

    @computed get allValues(): LineChartValue[] {
        const values = []
        for (const series of this.props.data) {
            values.push(...series.values)
        }
        return values
    }

    @computed get hoverData(): HoverTarget[] {
        const { data } = this.props
        return flatten(
            this.renderData.map((series, i) => {
                return series.values.map((v, j) => {
                    return {
                        pos: v,
                        series: data[i],
                        value: data[i].values[j]
                    }
                })
            })
        )
    }

    @action.bound onCursorMove(ev: MouseEvent | TouchEvent) {
        const { axisBox, xScale } = this.props

        const mouse = getRelativeMouse(this.base.current, ev)

        let hoverX
        if (axisBox.innerBounds.contains(mouse)) {
            const closestValue = sortBy(this.allValues, d =>
                Math.abs(xScale.place(d.x) - mouse.x)
            )[0]
            hoverX = closestValue.x
        }

        this.props.onHover(hoverX)
    }

    @action.bound onCursorLeave(ev: MouseEvent | TouchEvent) {
        this.props.onHover(undefined)
    }

    @computed get bounds() {
        const { xScale, yScale } = this.props
        return Bounds.fromCorners(
            new Vector2(xScale.range[0], yScale.range[0]),
            new Vector2(xScale.range[1], yScale.range[1])
        )
    }

    @computed get focusGroups() {
        return filter(this.renderData, g => g.isFocus)
    }

    @computed get backgroundGroups() {
        return filter(this.renderData, g => !g.isFocus)
    }

    // Don't display point markers if there are very many of them for performance reasons
    // Note that we're using circle elements instead of marker-mid because marker performance in Safari 10 is very poor for some reason
    @computed get hasMarkers(): boolean {
        return sum(this.renderData.map(g => g.values.length)) < 500
    }

    renderFocusGroups() {
        return this.focusGroups.map(series => (
            <g key={series.displayKey} className={series.displayKey}>
                <path
                    stroke={series.color}
                    strokeLinecap="round"
                    d={pointsToPath(
                        series.values.map(v => [v.x, v.y]) as [number, number][]
                    )}
                    fill="none"
                    strokeWidth={1.5}
                    strokeDasharray={series.isProjection ? "1,4" : undefined}
                />
                {this.hasMarkers && !series.isProjection && (
                    <g fill={series.color}>
                        {series.values.map((v, i) => (
                            <circle key={i} cx={v.x} cy={v.y} r={2} />
                        ))}
                    </g>
                )}
            </g>
        ))
    }

    renderBackgroundGroups() {
        return this.backgroundGroups.map(series => (
            <g key={series.displayKey} className={series.displayKey}>
                <path
                    key={series.entityDimensionKey + "-line"}
                    strokeLinecap="round"
                    stroke="#ddd"
                    d={pointsToPath(
                        series.values.map(v => [v.x, v.y]) as [number, number][]
                    )}
                    fill="none"
                    strokeWidth={1}
                />
            </g>
        ))
    }

    container?: SVGElement
    componentDidMount() {
        const base = this.base.current as SVGGElement
        this.container = base.closest("svg") as SVGElement

        this.container.addEventListener("mousemove", this.onCursorMove)
        this.container.addEventListener("mouseleave", this.onCursorLeave)
        this.container.addEventListener("touchstart", this.onCursorMove)
        this.container.addEventListener("touchmove", this.onCursorMove)
        this.container.addEventListener("touchend", this.onCursorLeave)
        this.container.addEventListener("touchcancel", this.onCursorLeave)
    }

    componentWillUnmount() {
        if (this.container) {
            this.container.removeEventListener("mousemove", this.onCursorMove)
            this.container.removeEventListener("mouseleave", this.onCursorLeave)
            this.container.removeEventListener("touchstart", this.onCursorMove)
            this.container.removeEventListener("touchmove", this.onCursorMove)
            this.container.removeEventListener("touchend", this.onCursorLeave)
            this.container.removeEventListener(
                "touchcancel",
                this.onCursorLeave
            )
        }
    }

    render() {
        const { hover, bounds } = this

        return (
            <g ref={this.base} className="Lines">
                <rect
                    x={Math.round(bounds.x)}
                    y={Math.round(bounds.y)}
                    width={Math.round(bounds.width)}
                    height={Math.round(bounds.height)}
                    fill="rgba(255,255,255,0)"
                    opacity={0}
                />
                {this.renderBackgroundGroups()}
                {this.renderFocusGroups()}
                {hover && (
                    <circle
                        cx={hover.pos.x}
                        cy={hover.pos.y}
                        r={5}
                        fill={hover.series.color}
                    />
                )}
            </g>
        )
    }
}
