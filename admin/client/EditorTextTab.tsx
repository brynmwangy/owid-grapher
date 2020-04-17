import * as React from "react"
import { action } from "mobx"
import { observer } from "mobx-react"
import { ChartEditor } from "./ChartEditor"
import {
    Toggle,
    Section,
    BindString,
    BindAutoString,
    AutoTextField,
    RadioGroup
} from "./Forms"
import { LogoOption } from "charts/Logos"
import slugify from "slugify"

@observer
export class EditorTextTab extends React.Component<{ editor: ChartEditor }> {
    @action.bound onSlug(slug: string) {
        this.props.editor.chart.props.slug = slugify(slug).toLowerCase()
    }

    @action.bound onChangeLogo(value: string) {
        if (value === "none") {
            this.props.editor.chart.props.hideLogo = true
        } else {
            this.props.editor.chart.props.hideLogo = undefined
            this.props.editor.chart.props.logo = (value ||
                undefined) as LogoOption
        }
    }

    render() {
        const { chart, references } = this.props.editor

        return (
            <div>
                <Section name="Header">
                    <BindAutoString
                        field="title"
                        store={chart.props}
                        auto={chart.data.title}
                        softCharacterLimit={100}
                    />
                    <Toggle
                        label="Hide automatic time/entity"
                        value={!!chart.props.hideTitleAnnotation}
                        onValue={action(
                            (value: boolean) =>
                                (chart.props.hideTitleAnnotation =
                                    value || undefined)
                        )}
                    />
                    <AutoTextField
                        label="/grapher"
                        value={chart.data.slug}
                        onValue={this.onSlug}
                        isAuto={chart.props.slug === undefined}
                        onToggleAuto={_ =>
                            (chart.props.slug =
                                chart.props.slug === undefined
                                    ? chart.data.slug
                                    : undefined)
                        }
                        helpText="Human-friendly URL for this chart"
                    />
                    <BindString
                        field="subtitle"
                        store={chart.props}
                        placeholder="Briefly describe the context of the data. It's best to avoid duplicating any information which can be easily inferred from other visual elements of the chart."
                        textarea
                        softCharacterLimit={280}
                    />
                    <h6>Logo</h6>
                    <RadioGroup
                        options={[
                            { label: "OWID", value: "owid" },
                            { label: "CORE+OWID", value: "core+owid" },
                            { label: "No logo", value: "none" }
                        ]}
                        value={
                            chart.props.hideLogo
                                ? "none"
                                : chart.props.logo || "owid"
                        }
                        onChange={this.onChangeLogo}
                    />
                </Section>
                <Section name="Footer">
                    <BindAutoString
                        label="Source"
                        field="sourceDesc"
                        store={chart.props}
                        auto={chart.data.sourcesLine}
                        helpText="Short comma-separated list of source names"
                        softCharacterLimit={60}
                    />
                    <BindString
                        label="Origin url"
                        field="originUrl"
                        store={chart.props}
                        placeholder={chart.data.originUrl}
                        helpText="The page containing this chart where more context can be found"
                    />
                    {references && references.length > 0 && (
                        <div className="originSuggestions">
                            <p>Origin url suggestions</p>
                            <ul>
                                {references.map(post => (
                                    <li key={post.id}>{post.url}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <BindString
                        label="Footer note"
                        field="note"
                        store={chart.props}
                        helpText="Any important clarification needed to avoid miscommunication"
                        softCharacterLimit={140}
                    />
                </Section>
                <Section name="Misc">
                    <BindString
                        label="Internal author notes"
                        field="internalNotes"
                        store={chart.props}
                        placeholder="e.g. WIP, needs review, etc"
                        textarea
                    />
                    <BindString
                        label="Variant name"
                        field="variantName"
                        store={chart.props}
                        placeholder="e.g. IHME data"
                        helpText="Optional variant name for distinguishing charts with the same title"
                    />
                </Section>
            </div>
        )
    }
}
