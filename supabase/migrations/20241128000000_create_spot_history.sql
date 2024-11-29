-- Create spot_history table
CREATE TABLE IF NOT EXISTS spot_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_id INTEGER NOT NULL REFERENCES spots(id),
    previous_project_name VARCHAR(255),
    project_name VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(44) CHECK (
        wallet_address IS NULL OR 
        LENGTH(wallet_address) BETWEEN 32 AND 44
    ),
    price_paid DECIMAL NOT NULL CHECK (price_paid >= 0),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_steal BOOLEAN DEFAULT false,
    hold_duration_hours INTEGER,
    ownership_end_time TIMESTAMP WITH TIME ZONE,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('claim', 'steal', 'transfer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spot_history_spot_id ON spot_history(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_history_timestamp ON spot_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_spot_history_project_name ON spot_history(project_name);
CREATE INDEX IF NOT EXISTS idx_spot_history_wallet_address ON spot_history(wallet_address);

-- Create trigger for updating timestamp
CREATE TRIGGER update_spot_history_updated_at
    BEFORE UPDATE ON spot_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update spot_history on spots update
CREATE OR REPLACE FUNCTION update_spot_history()
RETURNS TRIGGER AS $$
DECLARE
    last_history RECORD;
    duration_hours INTEGER;
BEGIN
    -- Only create history entry if project_name or current_bidder changed
    IF (OLD.project_name IS DISTINCT FROM NEW.project_name) OR 
       (OLD.current_bidder IS DISTINCT FROM NEW.current_bidder) THEN
        
        -- Get the last history entry for this spot
        SELECT * INTO last_history 
        FROM spot_history 
        WHERE spot_id = NEW.id 
        ORDER BY timestamp DESC 
        LIMIT 1;
        
        -- Calculate hold duration for the previous owner
        IF last_history.id IS NOT NULL THEN
            duration_hours := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_history.timestamp))/3600;
            
            -- Update the previous entry's hold duration and end time
            UPDATE spot_history 
            SET hold_duration_hours = duration_hours,
                ownership_end_time = CURRENT_TIMESTAMP
            WHERE id = last_history.id;
        END IF;

        -- Determine if this is a steal
        -- A steal is when the spot is taken from an existing owner
        IF OLD.project_name IS NOT NULL AND NEW.project_name IS NOT NULL THEN
            INSERT INTO spot_history (
                spot_id,
                previous_project_name,
                project_name,
                wallet_address,
                price_paid,
                is_steal,
                transaction_type
            ) VALUES (
                NEW.id,
                OLD.project_name,
                NEW.project_name,
                NEW.current_bidder,
                NEW.current_bid,
                true,
                'steal'
            );
        -- If there was no previous owner, it's a claim
        ELSIF OLD.project_name IS NULL AND NEW.project_name IS NOT NULL THEN
            INSERT INTO spot_history (
                spot_id,
                previous_project_name,
                project_name,
                wallet_address,
                price_paid,
                is_steal,
                transaction_type
            ) VALUES (
                NEW.id,
                NULL,
                NEW.project_name,
                NEW.current_bidder,
                NEW.current_bid,
                false,
                'claim'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update spot_history
CREATE TRIGGER update_spot_history_trigger
    AFTER UPDATE ON spots
    FOR EACH ROW
    EXECUTE FUNCTION update_spot_history();

-- Backfill spot_history for existing spots
-- This assumes that current owners are the first owners
INSERT INTO spot_history (
    spot_id,
    project_name,
    wallet_address,
    price_paid,
    is_steal,
    transaction_type
)
SELECT 
    id,
    project_name,
    current_bidder,
    current_bid,
    false,
    'claim'
FROM spots 
WHERE project_name IS NOT NULL
AND NOT EXISTS (
    SELECT 1 
    FROM spot_history 
    WHERE spot_history.spot_id = spots.id
);
