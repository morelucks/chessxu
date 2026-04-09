import { useAppContext }from '../../../contexts/Context'
import { takeBack } from '../../../reducer/actions/move';

const TakeBack = () => {

    const { dispatch } = useAppContext();

    return <div>
        <button className="btn btn-danger" onClick={() => dispatch(takeBack())}>Take Back</button>
    </div>
}

export default TakeBack