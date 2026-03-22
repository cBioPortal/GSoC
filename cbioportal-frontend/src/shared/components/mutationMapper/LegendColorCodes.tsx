import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { DEFAULT_PROTEIN_IMPACT_TYPE_COLORS } from 'react-mutation-mapper';
import * as React from 'react';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';

interface ILegendColorCodesProps {
    isPutativeDriver?: (mutation: Partial<AnnotatedMutation>) => boolean;
    hideFusions?: boolean;
}

export const LegendColorCodes: React.FC<ILegendColorCodesProps> = observer(
    ({ isPutativeDriver, hideFusions }: ILegendColorCodesProps) => {
        return (
            <div style={{ maxWidth: 700, marginTop: 5 }}>
                <strong style={{ color: '#2153AA' }}>Color Codes</strong>
                <p>
                    Mutation diagram circles are colored with respect to the
                    corresponding mutation types. In case of different mutation
                    types at a single position, color of the circle is
                    determined with respect to the most frequent mutation type.
                </p>
                <br />
                <div>
                    Mutation types and corresponding color codes are as follows:
                    <ul>
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.missenseColor,
                                }}
                            >
                                Missense Mutations
                            </strong>
                            {isPutativeDriver !== undefined && (
                                <span> (putative driver)</span>
                            )}
                        </li>
                        {isPutativeDriver !== undefined && (
                            <li>
                                <strong
                                    style={{
                                        color:
                                            DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.missenseVusColor,
                                    }}
                                >
                                    Missense Mutations
                                </strong>
                                {isPutativeDriver !== undefined && (
                                    <span> (unknown significance)</span>
                                )}
                            </li>
                        )}
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.truncatingColor,
                                }}
                            >
                                Truncating Mutations
                            </strong>
                            {isPutativeDriver !== undefined && (
                                <span> (putative driver)</span>
                            )}
                            : Nonsense, Nonstop, Frameshift deletion, Frameshift
                            insertion, Splice site
                        </li>
                        {isPutativeDriver !== undefined && (
                            <li>
                                <strong
                                    style={{
                                        color:
                                            DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.truncatingVusColor,
                                    }}
                                >
                                    Truncating Mutations
                                </strong>
                                {isPutativeDriver !== undefined && (
                                    <span> (unknown significance)</span>
                                )}
                                : Nonsense, Nonstop, Frameshift deletion,
                                Frameshift insertion, Splice site
                            </li>
                        )}
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.inframeColor,
                                }}
                            >
                                Inframe Mutations
                            </strong>
                            {isPutativeDriver !== undefined && (
                                <span> (putative driver)</span>
                            )}
                            : Inframe deletion, Inframe insertion
                        </li>
                        {isPutativeDriver !== undefined && (
                            <li>
                                <strong
                                    style={{
                                        color:
                                            DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.inframeVusColor,
                                    }}
                                >
                                    Inframe Mutations
                                </strong>
                                {isPutativeDriver !== undefined && (
                                    <span> (unknown significance)</span>
                                )}
                                : Inframe deletion, Inframe insertion
                            </li>
                        )}
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.spliceColor,
                                }}
                            >
                                Splice Mutations
                            </strong>
                            {isPutativeDriver !== undefined && (
                                <span> (putative driver)</span>
                            )}
                        </li>
                        {isPutativeDriver !== undefined && (
                            <li>
                                <strong
                                    style={{
                                        color:
                                            DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.spliceVusColor,
                                    }}
                                >
                                    Splice Mutations
                                </strong>
                                {isPutativeDriver !== undefined && (
                                    <span> (unknown significance)</span>
                                )}
                            </li>
                        )}
                        {!hideFusions && (
                            <li>
                                <strong
                                    style={{
                                        color:
                                            DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.fusionColor,
                                    }}
                                >
                                    Fusion Mutations
                                </strong>
                            </li>
                        )}
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.otherColor,
                                }}
                            >
                                Other Mutations
                            </strong>
                            {isPutativeDriver !== undefined && (
                                <span> (putative driver)</span>
                            )}
                            : All other types of mutations
                        </li>
                        {isPutativeDriver !== undefined && (
                            <li>
                                <strong
                                    style={{
                                        color:
                                            DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.otherVusColor,
                                    }}
                                >
                                    Other Mutations
                                </strong>
                                {isPutativeDriver !== undefined && (
                                    <span> (unknown significance)</span>
                                )}
                                : All other types of mutations
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        );
    }
);
