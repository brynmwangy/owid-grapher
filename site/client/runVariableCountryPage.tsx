import * as React from "react"
import { OwidVariableDisplaySettings } from "charts/owidData/OwidVariable"
import ReactDOM from "react-dom"
import { clone } from "charts/Util"
import { computed, IReactionDisposer, observable } from "mobx"
import { ChartConfig } from "charts/ChartConfig"
import { ChartFigureView } from "./ChartFigureView"
import { observer } from "mobx-react"

interface Variable {
    id: number
    name: string
    unit: string
    shortUnit: string
    description: string
    display: OwidVariableDisplaySettings

    datasetId: number
    datasetName: string
    datasetNamespace: string

    source: { id: number; name: string }
}

interface Country {
    id: number
    name: string
}

@observer
class ClientVariableCountryPage extends React.Component<{
    variable: Variable
    country: Country
}> {
    @observable.ref chart?: ChartConfig

    @computed get chartConfig() {
        const { variable, country } = this.props
        return {
            yAxis: { min: 0 },
            map: { variableId: variable.id },
            tab: "chart",
            hasMapTab: true,
            dimensions: [
                {
                    property: "y",
                    variableId: variable.id,
                    display: clone(variable.display)
                }
            ],
            selectedData: [
                {
                    entityId: country.id,
                    index: 0
                }
            ]
        }
    }

    dispose!: IReactionDisposer
    componentDidMount() {
        this.chart = new ChartConfig(this.chartConfig as any, { isEmbed: true })
    }

    render() {
        const { variable, country } = this.props
        return (
            <React.Fragment>
                <h1>
                    {variable.name} in {country.name}
                </h1>
                {this.chart && <ChartFigureView chart={this.chart} />}
            </React.Fragment>
        )
    }
}

export function runVariableCountryPage(props: any) {
    ReactDOM.render(
        <ClientVariableCountryPage {...props} />,
        document.querySelector("main")
    )
}
