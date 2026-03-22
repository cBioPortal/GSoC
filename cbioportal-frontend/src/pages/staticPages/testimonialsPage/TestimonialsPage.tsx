import * as React from 'react';

import { observer } from 'mobx-react';

import { ITestimonial } from 'shared/components/testimonials/Testimonials';
import { TestimonialStore } from 'shared/components/testimonials/Testimonials';

import styles from './testimonialsPage.module.scss';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';

@observer
export default class TestimonialsPage extends React.Component<{}, {}> {
    private store: TestimonialStore;

    constructor(props: any) {
        super(props);

        this.store = new TestimonialStore();
    }

    renderTestimonials() {
        return this.store.testimonials.map(
            (testimonial: ITestimonial, i: number) => (
                <div className="testimonial-blockquote" key={i}>
                    <blockquote className="blockquote">
                        "{testimonial.quote}"
                        <footer className="blockquote-footer">
                            <cite title="Source Title">{testimonial.cite}</cite>
                        </footer>
                    </blockquote>
                </div>
            )
        );
    }

    public render() {
        return (
            <PageLayout className={'whiteBackground'}>
                <div id="testimonialsPage" className={styles.testimonialsPage}>
                    <h1>What People Are Saying</h1>
                    {this.renderTestimonials()}
                </div>
            </PageLayout>
        );
    }
}
